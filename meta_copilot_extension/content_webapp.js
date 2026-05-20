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

  // 2. Listen to compile request messages dispatched from the React Web App
  window.addEventListener("message", (event) => {
    // Only accept trustable messages from our own window
    if (event.source !== window) return;

    if (event.data && event.data.type === "START_AUTO_COMPILE") {
      console.log("Bridge received webapp trigger:", event.data);
      chrome.runtime.sendMessage({
        action: "START_AUTOMATION",
        prompt1: event.data.prompt1,
        prompt2: event.data.prompt2
      }, (response) => {
        console.log("Background initiation response:", response);
      });
    }
  });

  // 3. Listen to automation progress updates sent back from the background worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "LOG_PROGRESS") {
      // Pass progress up to the React app window
      window.postMessage({
        type: "COPILOT_PROGRESS_UPDATE",
        updates: message.updates
      }, "*");
    } 
    
    else if (message.action === "COMPILATION_COMPLETE") {
      // Pass results to React
      window.postMessage({
        type: "COPILOT_SUCCESS",
        part1VideoUrl: message.part1VideoUrl,
        part2VideoUrl: message.part2VideoUrl
      }, "*");
    }
  });
}

