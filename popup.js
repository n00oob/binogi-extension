const buttons = {
  off: document.getElementById('off'),
  highlight: document.getElementById('highlight'),
  sneaky: document.getElementById('sneaky')
};

function updateUI(activeId) {
  Object.keys(buttons).forEach(id => {
    if (id === activeId) {
      buttons[id].classList.add('active');
    } else {
      buttons[id].classList.remove('active');
    }
  });
}

function sendMode(mode) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (!tabs[0]) return;
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: (m) => { window.postMessage({ type: "FROM_EXTENSION", mode: m }, "*"); },
      args: [mode]
    });
  });
  updateUI(mode);
  // Optional: Save state so it stays selected when you reopen the popup
  chrome.storage.local.set({ currentMode: mode });
}

// Click Listeners
buttons.off.addEventListener('click', () => sendMode('off'));
buttons.highlight.addEventListener('click', () => sendMode('highlight'));
buttons.sneaky.addEventListener('click', () => sendMode('sneaky'));

// Restore previous selection on popup open
chrome.storage.local.get(['currentMode'], (result) => {
  if (result.currentMode) {
    updateUI(result.currentMode);
  }
});