(function() {
  let currentMode = window.localStorage.getItem('quiz_helper_mode') || "off";

  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "FROM_EXTENSION") {
      currentMode = event.data.mode;
      window.localStorage.setItem('quiz_helper_mode', currentMode);
      if (currentMode === "off") {
        clearHighlights();
      } else {
        triggerScan();
      }
    }
  });

  function clearHighlights() {
    document.querySelectorAll('[data-cy="quiz-answer-option"]').forEach(label => {
      label.style.outline = "";
      label.style.background = "";
      label.style.borderRadius = "";
    });
    var textInput = document.querySelector('input[type="text"], input:not([type="checkbox"]):not([type="radio"]), textarea');
    if (textInput) {
      textInput.placeholder = "";
    }
  }

  function triggerScan() {
    var root = document.querySelector('[ng-app]') || document.body;
    if (!window.angular) return;
    var injector = window.angular.element(root).injector();
    if (!injector) return;
    var quizFactory = injector.get('quizFactory');
    if (quizFactory && quizFactory.currentLevel && quizFactory.currentLevel.currentQuestion) {
      processQuestion(quizFactory.currentLevel.currentQuestion);
    }
  }

  function processQuestion(question) {
    if (currentMode !== "highlight") return;
    if (!question) return;

    if (question.type === 'single' || question.type === 'multiple') {
      question.options.forEach(function(option, index) {
        if (option.correct === 1 || option.correct === true) {
          var input = document.getElementById('answer-' + option.id);
          var label = input ? input.closest('label') : document.querySelectorAll('[data-cy="quiz-answer-option"]')[index];
          if (label) {
            label.style.outline = "3px solid #00e676";
            label.style.background = "rgba(0,230,118,0.15)";
            label.style.borderRadius = "6px";
          }
        }
      });
    } else if ((question.type === 'short_answer' || question.type === 'freeText') && question.options) {
      var correctOption = question.options.find(function(o) {
        return o.correct === 1 || o.correct === true || o.isCorrect === true;
      });
      if (correctOption && correctOption.text) {
        var answerText = correctOption.text['sv'] || correctOption.text['en'] || Object.values(correctOption.text)[0] || "";
        if (answerText) {
          var textInput = document.querySelector('input[type="text"], input:not([type="checkbox"]):not([type="radio"]), textarea');
          if (textInput) {
            textInput.placeholder = answerText;
          }
        }
      }
    }
  }

  function initWatcher() {
    var root = document.querySelector('[ng-app]') || document.body;
    if (!window.angular) {
      setTimeout(initWatcher, 100);
      return;
    }
    var injector = window.angular.element(root).injector();
    if (!injector) {
      setTimeout(initWatcher, 100);
      return;
    }

    var $rootScope = injector.get('$rootScope');
    var quizFactory = injector.get('quizFactory');

    $rootScope.$watch(function() {
      if (quizFactory && quizFactory.currentLevel && quizFactory.currentLevel.currentQuestion) {
        return quizFactory.currentLevel.currentQuestion.id;
      }
      return null;
    }, function(newId) {
      if (!newId) return;
      setTimeout(function() {
        processQuestion(quizFactory.currentLevel.currentQuestion);
      }, 50);
    });
  }

  initWatcher();
})();
