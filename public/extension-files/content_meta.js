// Automation content script running on Meta AI (meta.ai)
console.log("Meta AI Co-Pilot Extension: Automation Engine Loaded!");

// Track existing videos to only detect newly generated clips
const existingVideos = new Set();

function registerExistingVideos() {
  document.querySelectorAll('video').forEach(video => {
    if (video.src) {
      existingVideos.add(video.src);
    }
  });
}

function findChatInput() {
  return document.querySelector('div[contenteditable="true"]') || 
         document.querySelector('textarea') || 
         document.querySelector('input[type="text"]');
}

function typeText(inputElement, text) {
  inputElement.focus();
  if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
    inputElement.value = text;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // Contenteditable div
    inputElement.focus();
    // Clear initial contenteditable text safely
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    // Write text programmatically
    document.execCommand('insertText', false, text);
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function clickSend() {
  const sendButton = document.querySelector('button[aria-label*="Send message"]') ||
                     document.querySelector('button[aria-label*="Send"]') ||
                     document.querySelector('button[type="submit"]') ||
                     document.querySelector('button[class*="send"]');
  if (sendButton) {
    sendButton.focus();
    sendButton.click();
    return true;
  }
  
  // Fallback: Dispatch Enter key event on the input box
  const input = findChatInput();
  if (input) {
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    input.dispatchEvent(event);
    return true;
  }
  return false;
}

function pollForNewVideo(callback) {
  console.log("Polling for new generated video...");
  const pollInterval = setInterval(() => {
    const videos = document.querySelectorAll('video');
    for (let video of videos) {
      if (video.src && !existingVideos.has(video.src) && !video.src.includes('blob:https://www.meta.ai/placeholder')) {
        console.log("Detected new video generated:", video.src);
        clearInterval(pollInterval);
        callback(video.src);
        return;
      }
    }
  }, 1000);
}

// Core execution workflow
function runAutomation() {
  chrome.runtime.sendMessage({ action: "GET_TASK_DATA" }, (task) => {
    if (!task || task.status === "completed" || !task.status) {
      console.log("No active automation tasks found.");
      return;
    }

    console.log("Current active task state:", task);

    // Initial setup: register all videos already in the chat so we ignore them
    registerExistingVideos();

    const input = findChatInput();
    if (!input) {
      // Chat input is not rendered yet, wait 1.5 seconds and retry
      console.log("Waiting for Meta AI chat interface to render...");
      setTimeout(runAutomation, 1500);
      return;
    }

    if (task.status === "generating_part1") {
      // 1. Ingest Prompt 1
      console.log("Injecting Prompt 1 into Meta AI...");
      typeText(input, task.prompt1);
      
      // Update background status to waiting before clicking send
      chrome.runtime.sendMessage({
        action: "UPDATE_STAGE",
        updates: { 
          status: "waiting_part1",
          logs: [...(task.logs || []), "Clip 1 prompt sent. Waiting for compilation..."]
        }
      }, () => {
        setTimeout(() => {
          clickSend();
          // Start monitoring for newly rendered video
          pollForNewVideo((videoUrl) => {
            handlePart1Complete(videoUrl);
          });
        }, 800);
      });
    }

    else if (task.status === "waiting_part1") {
      // If extension refreshed or is in waiting stage, re-attach listener
      pollForNewVideo((videoUrl) => {
        handlePart1Complete(videoUrl);
      });
    }

    else if (task.status === "generating_part2") {
      // 2. Ingest Prompt 2 in the SAME chat session!
      console.log("Injecting Prompt 2 (continuation) into Meta AI...");
      typeText(input, task.prompt2);

      chrome.runtime.sendMessage({
        action: "UPDATE_STAGE",
        updates: { 
          status: "waiting_part2",
          logs: [...(task.logs || []), "Clip 2 prompt sent. Waiting for seamless continuation clip..."]
        }
      }, () => {
        setTimeout(() => {
          clickSend();
          pollForNewVideo((videoUrl) => {
            handlePart2Complete(videoUrl);
          });
        }, 800);
      });
    }

    else if (task.status === "waiting_part2") {
      pollForNewVideo((videoUrl) => {
        handlePart2Complete(videoUrl);
      });
    }
  });
}

function handlePart1Complete(videoUrl) {
  chrome.runtime.sendMessage({ action: "GET_TASK_DATA" }, (task) => {
    chrome.runtime.sendMessage({
      action: "UPDATE_STAGE",
      updates: {
        part1VideoUrl: videoUrl,
        status: "generating_part2",
        logs: [...(task.logs || []), "Clip 1 compiled successfully! Starting Clip 2..."]
      }
    }, () => {
      // Re-trigger automation script immediately to enter prompt 2 in the same thread
      // First add the newly created Clip 1 video to exclusions list so it's not checked again
      existingVideos.add(videoUrl);
      runAutomation();
    });
  });
}

function handlePart2Complete(videoUrl) {
  chrome.runtime.sendMessage({ action: "GET_TASK_DATA" }, (task) => {
    chrome.runtime.sendMessage({
      action: "UPDATE_STAGE",
      updates: {
        part2VideoUrl: videoUrl,
        status: "completed",
        logs: [...(task.logs || []), "Clip 2 compiled successfully! Stitching video sequence..."]
      }
    }, () => {
      // Send final success call to complete execution
      chrome.runtime.sendMessage({ action: "AUTOMATION_COMPLETE" });
    });
  });
}

// Initial script execution on load
if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(runAutomation, 2000);
} else {
  window.addEventListener("load", () => {
    setTimeout(runAutomation, 2000);
  });
}
