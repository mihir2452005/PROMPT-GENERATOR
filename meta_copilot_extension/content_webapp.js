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

  // Helper: safely send messages to the background service worker
  // Catches "Extension context invalidated" errors that occur when the extension
  // has been reloaded (e.g. user clicked the toolbar icon) while this content script is still running.
  function safeSendMessage(payload, callback) {
    try {
      if (!chrome.runtime?.id) {
        // Extension context is already dead — notify the UI
        window.dispatchEvent(new CustomEvent("COPILOT_PROGRESS_UPDATE_EVENT", {
          detail: {
            status: "failed",
            logs: ["Extension was reloaded or removed. Please refresh this page (F5) and try again."]
          }
        }));
        return;
      }
      chrome.runtime.sendMessage(payload, (response) => {
        if (chrome.runtime.lastError) {
          const errMsg = chrome.runtime.lastError.message || "";
          console.warn("Bridge runtime error:", errMsg);
          // If context is invalidated, tell the user to refresh
          if (errMsg.includes("invalidated") || errMsg.includes("Extension context")) {
            window.dispatchEvent(new CustomEvent("COPILOT_PROGRESS_UPDATE_EVENT", {
              detail: {
                status: "failed",
                logs: ["Extension was reloaded. Please refresh this page (F5) to reconnect."]
              }
            }));
          } else {
            window.dispatchEvent(new CustomEvent("COPILOT_PROGRESS_UPDATE_EVENT", {
              detail: {
                status: "failed",
                logs: ["Extension communication error: " + errMsg]
              }
            }));
          }
        } else if (callback) {
          callback(response);
        }
      });
    } catch (err) {
      console.error("Bridge exception:", err);
      window.dispatchEvent(new CustomEvent("COPILOT_PROGRESS_UPDATE_EVENT", {
        detail: {
          status: "failed",
          logs: ["Extension context invalidated. Please refresh this page (F5) and try again."]
        }
      }));
    }
  }

  // 2. Listen to compile request events dispatched from the React Web App
  window.addEventListener("START_AUTO_COMPILE_EVENT", (event) => {
    const data = event.detail;
    console.log("Bridge received webapp trigger event:", data);
    safeSendMessage({
      action: "START_AUTOMATION",
      prompt1: data.prompt1,
      prompt2: data.prompt2
    }, (response) => {
      console.log("Background initiation response:", response);
      window.dispatchEvent(new CustomEvent("COPILOT_PROGRESS_UPDATE_EVENT", {
        detail: {
          logs: ["Extension bridge connected.", "Background response received: " + JSON.stringify(response)]
        }
      }));
    });
  });

  // 3. Listen to automation progress updates sent back from the background worker
  try {
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
  } catch (err) {
    console.warn("Could not attach onMessage listener — extension context may be invalidated:", err);
  }
}
