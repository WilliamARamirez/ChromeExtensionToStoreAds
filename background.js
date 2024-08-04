function setupContextMenu() {
  chrome.contextMenus.create({
    id: "scrape-ad",
    title: "scrape ad",
    contexts: ["selection"],
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

chrome.contextMenus.onClicked.addListener((data, tab) => {
  // Store the last word in chrome.storage.session.
  chrome.storage.session.set({ data: data });

  // Make sure the side panel is open.
  chrome.sidePanel.open({ tabId: tab.id });
});

// Function to extract query parameters
function getQueryParams(url) {
  const params = {};
  const queryString = url.split("?")[1] || "";
  new URLSearchParams(queryString).forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// Listener for web requests to the target URL
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.method === "POST") {
      const url = details.url;
      const queryParams = getQueryParams(url);
      const formData = details.requestBody.formData;

      chrome.cookies.getAll({ url: "https://www.facebook.com" }, (cookies) => {
        console.log(cookies);
        chrome.storage.local.set({ cookies }, () => {
          console.log("Stored cookies:", cookies);
        });
      });

      // Store query params and form data:",
      chrome.storage.local.set({ queryParams, formData }, () => {
        // console.log(
        //   "Stored query params and form data:",
        //   formData,
        //   queryParams
        // );
      });
    }
  },
  {
    urls: ["*://www.facebook.com/*"],
  },
  ["requestBody"]
);

// Handle messages from the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getStoredData") {
    chrome.storage.local.get(["queryParams", "formData"], (data) => {
      sendResponse(data);
    });
    return true; // Keep the messaging channel open for async response
  }
});
