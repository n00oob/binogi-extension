(function() {
  const isQuizUrl = url => url && /api\/v3\/lessons\/[^/]+\/quiz/.test(url);
  const correctOids = new Set();
  const correctAnswers = [];
  let currentMode = "off"; 
  let originalTitle = document.title;

  const parseQuiz = data => {
    const questions = data?.quiz?.questions ?? data?.questions;
    if (!questions) return;
    
    correctOids.clear();
    correctAnswers.length = 0;

    questions.forEach(q => {
      if (q.type !== "freeText") {
        q.options.forEach(opt => {
          if (opt.isCorrect) correctOids.add(opt.oid);
        });
      } else {
        const correctOpt = q.options.find(opt => opt.isCorrect);
        if (correctOpt) {
          // Priority: Swedish -> English -> Any
          const textObj = correctOpt.text.sv || correctOpt.text.en || Object.values(correctOpt.text)[0];
          const answerString = typeof textObj === 'string' ? textObj : Object.values(textObj)[0];
          correctAnswers.push(answerString);
        }
      }
    });
    applyLogic();
  };

  // Network Interceptors
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url;
    const res = await origFetch.apply(this, args);
    if (isQuizUrl(url)) res.clone().json().then(parseQuiz).catch(() => {});
    return res;
  };

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    return origOpen.call(this, method, url, ...rest);
  };
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(...args) {
    if (isQuizUrl(this._url)) {
      this.addEventListener("load", function() {
        try { parseQuiz(JSON.parse(this.responseText)); } catch(e) {}
      });
    }
    return origSend.apply(this, args);
  };

  const applyLogic = () => {
    let firstCorrectText = "";

    // 1. Multiple Choice
    document.querySelectorAll('[data-cy="quiz-answer-option"]').forEach(label => {
      const input = label.querySelector("input");
      if (!input) return;
      const oid = input.id.replace("answer-", "");
      
      if (currentMode !== "off" && correctOids.has(oid)) {
        label.classList.add('is-correct-choice');
        if (!firstCorrectText) firstCorrectText = label.innerText.trim();
      } else {
        label.classList.remove('is-correct-choice');
      }
    });

    // 2. FreeText Placeholder
    const textInput = document.querySelector('[data-cy="quiz-answer-input"]');
    if (textInput) {
        if (currentMode === "sneaky" && correctAnswers.length > 0) {
            textInput.setAttribute("placeholder", correctAnswers[0]);
            if (!firstCorrectText) firstCorrectText = correctAnswers[0];
        } else {
            textInput.setAttribute("placeholder", "Write your answer here");
        }
    }

    // 3. Title Logic
    if (currentMode === "sneaky" && firstCorrectText) {
      document.title = firstCorrectText;
    } else {
      document.title = originalTitle;
    }
  };

  const style = document.createElement('style');
  style.innerHTML = `
    [data-cy="quiz-answer-option"] { position: relative !important; }
    
    body[data-quiz-mode="highlight"] .is-correct-choice {
      outline: 3px solid #00e676 !important;
      background: rgba(0,230,118,0.15) !important;
      border-radius: 6px !important;
    }

    body[data-quiz-mode="sneaky"] .is-correct-choice katex::after,
    body[data-quiz-mode="sneaky"] .is-correct-choice .option-text::after {
      content: "·"; margin-left: 4px; opacity: 0.15; color: inherit;
    }

    body[data-quiz-mode="sneaky"] [data-cy="quiz-answer-input"]::placeholder {
      color: #999 !important;
      opacity: 0.08 !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  const applyMode = (mode) => {
    currentMode = mode;
    if (document.body) {
      document.body.setAttribute('data-quiz-mode', currentMode);
      applyLogic();
    }
  };

  window.addEventListener("message", (e) => {
    if (e.data?.type === "FROM_EXTENSION") applyMode(e.data.mode);
  });

  const init = () => {
    if (document.body) {
      originalTitle = document.title;
      new MutationObserver(applyLogic).observe(document.body, { childList: true, subtree: true });
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();