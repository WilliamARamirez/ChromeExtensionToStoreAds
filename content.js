chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updatePanel") {
    // Send a message to the side panel
    chrome.runtime.sendMessage({ action: "updatePanel" });
  }
});
