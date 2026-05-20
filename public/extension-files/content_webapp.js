// Content script running on the React Web App tab

// Only run on the MetaPrompt Studio application pages
const metaTag = document.querySelector('meta[name="application-name"]');
if (!metaTag || metaTag.getAttribute("content") !== "MetaPrompt Studio") {
  // Not our website, do not run the bridge
} else {
  console.log("Meta AI Co-Pilot Extension: WebApp Bridge Active!");

  // 1. Tag document body so your React application knows the extension is installed & active
  document.body.dataset.metaCopilotInstalled = "true";

  // Dispatch a custom event to notify React immediately on mount
  window.dispatchEvent(new CustomEvent("META_COPILOT_INSTALLED"));

  // 2. Listen to compile request events dispatched from the React Web App
  window.addEventListener("START_AUTO_COMPILE_EVENT", (event) => {
    const data = event.detail;
    console.log("Bridge received webapp trigger event:", data);
    try {
      chrome.runtime.sendMessage({
        action: "START_AUTOMATION",
        prompt1: data.prompt1,
        prompt2: data.prompt2
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Bridge received runtime error from background:", chrome.runtime.lastError.message);
          window.dispatchEvent(new CustomEvent("COPILOT_PROGRESS_UPDATE_EVENT", {
            detail: {
              status: "failed",
              logs: ["Failed to connect to Extension Background. Re-load the extension or restart your browser."]
            }
          }));
        } else {
          console.log("Background initiation response:", response);
          window.dispatchEvent(new CustomEvent("COPILOT_PROGRESS_UPDATE_EVENT", {
            detail: {
              logs: ["Extension bridge connected.", "Background response received: " + JSON.stringify(response)]
            }
          }));
        }
      });
    } catch (err) {
      console.error("Bridge exception sending message:", err);
      window.dispatchEvent(new CustomEvent("COPILOT_PROGRESS_UPDATE_EVENT", {
        detail: {
          status: "failed",
          logs: ["Extension communication error: " + err.message]
        }
      }));
    }
  });

  // 3. Listen to automation progress updates sent back from the background worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "LOG_PROGRESS") {
      // Pass progress up to the React app window via CustomEvent
      window.dispatchEvent(new CustomEvent("COPILOT_PROGRESS_UPDATE_EVENT", {
        detail: message.updates
      }));
    } 
    
    else if (message.action === "COMPILATION_COMPLETE") {
      // Pass results to React via CustomEvent
      window.dispatchEvent(new CustomEvent("COPILOT_SUCCESS_EVENT", {
        detail: {
          part1VideoUrl: message.part1VideoUrl,
          part2VideoUrl: message.part2VideoUrl
        }
      }));
    }
  });
}


