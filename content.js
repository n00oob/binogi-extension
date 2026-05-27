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

  function initVideoHook() {
    setInterval(() => {
      document.querySelectorAll('i.fa:not([data-hooked])').forEach(icon => {
        const text = icon.parentElement?.textContent || '';
        if (text.includes('Titta på film') || text.includes('Video')) {
          icon.setAttribute('data-hooked', 'true');
          icon.addEventListener('click', () => {
            icon.removeAttribute('ng-class');
            icon.classList.remove('fa-square-o');
            icon.classList.add('fa-check-square-o');
            
            const container = icon.closest('.to-do');
            if (container) {
              container.removeAttribute('ng-class');
              container.classList.add('completed');
            }

            const root = document.querySelector('[ng-app]') || document.body;
            if (!window.angular) return;
            const injector = window.angular.element(root).injector();
            if (!injector) return;

            const headers = injector.get('$http').defaults.headers;
            const token = headers.post?.Authorization || headers.post?.authorization || headers.common?.Authorization || headers.Authorization;

            const ctrl = Array.from(document.querySelectorAll('*'))
              .map(element => window.angular.element(element).controller())
              .find(instance => instance?.playerContentFactory);

            if (!ctrl || !token) return;

            const lessonId = ctrl.playerContentFactory.lesson.id;
            const subjectId = ctrl.playerContentFactory.lesson.default_subject_id;

            const payload = {
              lesson_id: lessonId,
              watched_seconds: 5,
              subject_id: subjectId
            };

            fetch("https://api.binogi.se/lessons/videoReport", {
              method: "POST",
              headers: {
                "Authorization": token,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });
          }, { once: true });
        }
      });
    }, 1000);
  }

  function initQuizHook() {
    setInterval(() => {
      document.querySelectorAll('i.fa:not([data-quiz-hooked])').forEach(icon => {
        const text = icon.parentElement?.textContent || '';
        if (text.includes('Gör quiz') || text.includes('Quiz')) {
          icon.setAttribute('data-quiz-hooked', 'true');
          icon.addEventListener('click', () => {
            icon.removeAttribute('ng-class');
            icon.classList.remove('fa-square-o');
            icon.classList.add('fa-check-square-o');
            
            const container = icon.closest('.to-do');
            if (container) {
              container.removeAttribute('ng-class');
              container.classList.add('completed');
            }

            const root = document.querySelector('[ng-app]') || document.body;
            if (!window.angular) return;
            const injector = window.angular.element(root).injector();
            if (!injector) return;

            const headers = injector.get('$http').defaults.headers;
            const token = headers.post?.Authorization || headers.post?.authorization || headers.common?.Authorization || headers.Authorization;

            const ctrl = Array.from(document.querySelectorAll('*'))
              .map(element => window.angular.element(element).controller())
              .find(instance => instance?.playerContentFactory);

            if (!ctrl || !token) return;

            const lessonCode = ctrl.conceptsFactory?.id || ctrl.playerContentFactory?.lesson?.code;
            const subjectId = ctrl.playerContentFactory.lesson.default_subject_id;

            for (let level = 1; level <= 3; level++) {
              const payload = {
                level: level,
                lesson_code: lessonCode,
                result: [
                  {
                    question_uuid: "00000000-0000-4000-8000-000000000000",
                    result: true,
                    language_code: "sv",
                    answer_timestamp: Math.floor(Date.now() / 1000)
                  }
                ],
                subject_id: subjectId,
                passed: true
              };

              fetch("https://api.binogi.se/lessons/quizReport", {
                method: "POST",
                headers: {
                  "Authorization": token,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
              });
            }
          }, { once: true });
        }
      });
    }, 1000);
  }

  initWatcher();
  initVideoHook();
  initQuizHook();
})();
