// Automation content script running on Meta AI (meta.ai)
console.log("Meta AI Co-Pilot Extension: Automation Engine Loaded!");

// Safe message sender — prevents "Extension context invalidated" crashes
// when the extension is reloaded while automation is running on this tab.
function safeSendMessage(payload, callback) {
  try {
    if (!chrome.runtime?.id) {
      console.warn("Extension context is dead. Stopping automation.");
      return;
    }
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Runtime error in content_meta:", chrome.runtime.lastError.message);
        return;
      }
      if (callback) callback(response);
    });
  } catch (err) {
    console.warn("Extension context invalidated in content_meta:", err.message);
  }
}

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
         document.querySelector('input[type="text"]') ||
         document.querySelector('[role="textbox"]');
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
    try {
      // Clear initial contenteditable text safely
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      // Write text programmatically
      document.execCommand('insertText', false, text);
    } catch (err) {
      console.warn("execCommand failed, using innerText fallback:", err);
      inputElement.innerText = text;
    }
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function clickSend() {
  const sendButton = document.querySelector('button[aria-label*="Send message"]') ||
                     document.querySelector('button[aria-label*="Send"]') ||
                     document.querySelector('button[aria-label*="Submit"]') ||
                     document.querySelector('button[type="submit"]') ||
                     document.querySelector('button[class*="send"]') ||
                     document.querySelector('div[role="button"][aria-label*="Send"]') ||
                     document.querySelector('div[role="button"][aria-label*="Submit"]');
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

let lastProcessedError = "";

function checkForMetaAIErrorMessage() {
  const selectors = [
    'div[class*="assistant"]',
    'div[class*="bubble"]',
    'div[class*="message"]',
    'p',
    'li'
  ];
  
  const elements = [];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      // Get exact element layout bounds
      const rect = el.getBoundingClientRect();
      if (rect.top > 0 && el.innerText && el.innerText.trim().length > 10) {
        elements.push({ el, top: rect.top });
      }
    });
  });
  
  // Sort elements by their vertical layout coordinate (most recent at bottom of chat is first)
  elements.sort((a, b) => b.top - a.top);
  
  const keywords = [
    "failed to render",
    "generator's limits",
    "retry with just",
    "Which version do you want",
    "unable to generate",
    "error in rendering",
    "failed to generate",
    "try generating again",
    "limit reached",
    "failed to compile"
  ];
  
  // Check the 6 most recent elements at the bottom
  for (let i = 0; i < Math.min(6, elements.length); i++) {
    const text = elements[i].el.innerText || "";
    for (let kw of keywords) {
      if (text.toLowerCase().includes(kw.toLowerCase())) {
        return { detected: true, message: text };
      }
    }
  }
  return { detected: false };
}

function pollForNewVideo(callback) {
  console.log("Polling for new generated video...");
  
  const pollInterval = setInterval(() => {
    // 1. Check if a new video is generated successfully
    const videos = document.querySelectorAll('video');
    for (let video of videos) {
      if (video.src && !existingVideos.has(video.src) && !video.src.includes('blob:https://www.meta.ai/placeholder')) {
        console.log("Detected new video generated:", video.src);
        clearInterval(pollInterval);
        callback(video.src);
        return;
      }
    }

    // 2. Check if Meta AI hit a render limit/error or returned alternate options
    const errCheck = checkForMetaAIErrorMessage();
    if (errCheck.detected && errCheck.message !== lastProcessedError) {
      lastProcessedError = errCheck.message;
      console.warn("Meta AI limits/errors hit! Triggering self-healing recovery...", errCheck.message);

      // Devise a smart automatic response choice to guide Meta AI back into generation mode
      let retryResponse = "retry generating video with simpler motion";
      
      const lowerMsg = errCheck.message.toLowerCase();
      if (lowerMsg.includes("droplet focus-pull")) {
        retryResponse = "retry with just the droplet focus-pull";
      } else if (lowerMsg.includes("high-res still first")) {
        retryResponse = "generate it as a high-res still first, then animate it";
      } else if (lowerMsg.includes("separate clean pass")) {
        retryResponse = "do the 360 orbit as a separate clean pass";
      } else if (lowerMsg.includes("which version")) {
        retryResponse = "retry generating the shot with simpler options";
      }

      // Notify the React WebApp tab with full error details and retry strategy
      safeSendMessage({ action: "GET_TASK_DATA" }, (task) => {
        safeSendMessage({
          action: "UPDATE_STAGE",
          updates: {
            logs: [
              ...(task.logs || []),
              `⚠️ Meta AI hit limits: "${errCheck.message.substring(0, 120)}..."`,
              `🤖 Co-Pilot self-healing: Automatically replying with: "${retryResponse}"`
            ]
          }
        }, () => {
          // Clear input and send the retry message
          const input = findChatInput();
          if (input) {
            typeText(input, retryResponse);
            setTimeout(() => {
              clickSend();
              
              // Clear current interval and pause polling for 12 seconds to let the retry compile
              clearInterval(pollInterval);
              setTimeout(() => {
                pollForNewVideo(callback);
              }, 12000);
            }, 1000);
          }
        });
      });
    }
  }, 1800);
}

// Core execution workflow
function runAutomation() {
  safeSendMessage({ action: "GET_TASK_DATA" }, (task) => {
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
      safeSendMessage({
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

      safeSendMessage({
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
  safeSendMessage({ action: "GET_TASK_DATA" }, (task) => {
    safeSendMessage({
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
  safeSendMessage({ action: "GET_TASK_DATA" }, (task) => {
    safeSendMessage({
      action: "UPDATE_STAGE",
      updates: {
        part2VideoUrl: videoUrl,
        status: "completed",
        logs: [...(task.logs || []), "Clip 2 compiled successfully! Stitching video sequence..."]
      }
    }, () => {
      // Send final success call to complete execution
      safeSendMessage({ action: "AUTOMATION_COMPLETE" });
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
