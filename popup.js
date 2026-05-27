const buttons = {
  off: document.getElementById('off'),
  highlight: document.getElementById('highlight')
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
  chrome.storage.local.set({ currentMode: mode });
}

buttons.off.addEventListener('click', () => sendMode('off'));
buttons.highlight.addEventListener('click', () => sendMode('highlight'));

chrome.storage.local.get(['currentMode'], (result) => {
  if (result.currentMode) {
    updateUI(result.currentMode);
  }
});
