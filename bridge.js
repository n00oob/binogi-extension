// Listen for the "READY" signal from content.js
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CONTENT_SCRIPT_READY") {
    sendModeToPage();
  }
});

// Function to send current mode
function sendModeToPage() {
  chrome.storage.local.get(['quizMode'], (result) => {
    const mode = result.quizMode || 'highlight';
    window.postMessage({ type: "FROM_EXTENSION", mode: mode }, "*");
  });
}

// Also send mode if the user changes it in the popup
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "UPDATE_MODE") {
    window.postMessage({ type: "FROM_EXTENSION", mode: request.mode }, "*");
  }
});

// Initial attempt just in case
sendModeToPage();