// Background worker coordinating tab automation and state passing between webapp and meta.ai

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

  if (request.action === "START_AUTOMATION") {
    // Save generation instructions in local storage
    chrome.storage.local.set({
      prompt1: request.prompt1,
      prompt2: request.prompt2,
      status: "generating_part1",
      webappTabId: sender.tab.id,
      metaTabId: null,
      part1VideoUrl: null,
      part2VideoUrl: null,
      logs: ["Starting automation..."]
    }, () => {
      // Launch Meta AI in a fresh tab
      chrome.tabs.create({ url: "https://www.meta.ai/" }, (tab) => {
        chrome.storage.local.set({ metaTabId: tab.id });
      });
    });
    sendResponse({ status: "initiated" });
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
        });
        // Refocus the webapp tab so user sees their stitched 10s cinematic video instantly
        chrome.tabs.update(data.webappTabId, { active: true });
      }

      // 2. Close the automated Meta AI tab programmatically to keep the user's workspace tidy
      if (data.metaTabId) {
        chrome.tabs.remove(data.metaTabId);
      }

      // 3. Clear storage for next run
      chrome.storage.local.clear();
      sendResponse({ status: "cleaned" });
    });
    return true;
  }
});
