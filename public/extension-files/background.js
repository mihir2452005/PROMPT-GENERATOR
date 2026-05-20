// Background worker coordinating tab automation and state passing between webapp and meta.ai

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

  if (request.action === "START_AUTOMATION") {
    const webappTabId = (sender && sender.tab) ? sender.tab.id : null;
    
    if (!webappTabId) {
      console.error("Error: START_AUTOMATION called without a valid sender tab.");
      sendResponse({ status: "error", message: "No sender tab found" });
      return;
    }

    try {
      // Save generation instructions in local storage
      chrome.storage.local.set({
        prompt1: request.prompt1,
        prompt2: request.prompt2,
        status: "generating_part1",
        webappTabId: webappTabId,
        metaTabId: null,
        part1VideoUrl: null,
        part2VideoUrl: null,
        logs: ["Starting automation..."]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Storage error:", chrome.runtime.lastError.message);
          return;
        }

        // Send intermediate log to webapp tab
        chrome.tabs.sendMessage(webappTabId, {
          action: "LOG_PROGRESS",
          updates: {
            logs: ["Starting automation...", "Instructions saved. Opening Meta AI tab..."]
          }
        }, () => {
          const err = chrome.runtime.lastError;
        });

        // Launch Meta AI in a fresh tab
        chrome.tabs.create({ url: "https://www.meta.ai/" }, (tab) => {
          if (chrome.runtime.lastError) {
            console.error("Tab creation failed:", chrome.runtime.lastError.message);
            // Send error update to the webapp tab
            chrome.tabs.sendMessage(webappTabId, {
              action: "LOG_PROGRESS",
              updates: {
                status: "failed",
                logs: ["Failed to open Meta AI tab: " + chrome.runtime.lastError.message]
              }
            });
            return;
          }
          chrome.storage.local.set({ metaTabId: tab.id });
        });
      });
      sendResponse({ status: "initiated" });
    } catch (e) {
      console.error("Exception in START_AUTOMATION handler:", e);
      sendResponse({ status: "error", message: e.message });
    }
    return true; // Keep channel open for async response
  }

  else if (request.action === "GET_TASK_DATA") {
    chrome.storage.local.get(null, (data) => {
      sendResponse(data);
    });
    return true; // Keep message channel open for async response
  }

  else if (request.action === "UPDATE_STAGE") {
    chrome.storage.local.set(request.updates, () => {
      // Send real-time progress update to the webapp tab
      chrome.storage.local.get(["webappTabId"], (store) => {
        if (store.webappTabId) {
          chrome.tabs.sendMessage(store.webappTabId, {
            action: "LOG_PROGRESS",
            updates: request.updates
          }, () => {
            // Silence lastError if the tab is not listening or is closed
            const err = chrome.runtime.lastError;
          });
        }
      });
      sendResponse({ status: "updated" });
    });
    return true;
  }

  else if (request.action === "AUTOMATION_COMPLETE") {
    chrome.storage.local.get(null, (data) => {
      // 1. Notify the webapp tab that compilation was successful
      if (data.webappTabId) {
        chrome.tabs.sendMessage(data.webappTabId, {
          action: "COMPILATION_COMPLETE",
          part1VideoUrl: data.part1VideoUrl,
          part2VideoUrl: data.part2VideoUrl
        }, () => {
          // Silence lastError if the tab is not listening or is closed
          const err = chrome.runtime.lastError;
        });
        
        // Refocus the webapp tab so user sees their stitched 10s cinematic video instantly
        chrome.tabs.update(data.webappTabId, { active: true }, () => {
          const err = chrome.runtime.lastError;
        });
      }

      // 2. Close the automated Meta AI tab programmatically to keep the user's workspace tidy
      if (data.metaTabId) {
        chrome.tabs.remove(data.metaTabId, () => {
          const err = chrome.runtime.lastError;
        });
      }

      // 3. Clear storage for next run
      chrome.storage.local.clear();
      sendResponse({ status: "cleaned" });
    });
    return true;
  }
});
