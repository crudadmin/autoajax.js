import { shuffle } from 'lodash';
export default {
    run: function(options) {
        let {
            message = 'Please verify you are human.',
            buttons = ['No', 'Yes'],
            success = () => {},
            error = () => {},
        } = options;

        const correctAnswer = buttons[1];

        buttons = shuffle(buttons);

        const styles = `
        .captcha-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          animation: captchaFadeIn 0.3s ease;
        }

        @keyframes captchaFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .captcha-modal {
          background-color: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          text-align: center;
          max-width: 400px;
          width: 90%;
          animation: captchaSlideIn 0.3s ease;
        }

        @keyframes captchaSlideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .captcha-modal-text {
          font-size: 18px;
          margin-bottom: 30px;
          color: #333;
          font-family: Arial, sans-serif;
        }

        .captcha-boxes {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .captcha-box {
          width: 80px;
          height: 80px;
          border: 2px solid #333;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 32px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: #f9f9f9;
          font-family: Arial, sans-serif;
        }

        .captcha-box:hover {
          background-color: #e0e0e0;
          transform: scale(1.05);
        }

        .captcha-box:active {
          transform: scale(0.95);
        }

        .captcha-box.correct {
          background-color: #4caf50;
          color: white;
          border-color: #4caf50;
        }

        .captcha-box.incorrect {
          background-color: #f44336;
          color: white;
          border-color: #f44336;
        }
      `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        const overlay = document.createElement('div');
        overlay.className = 'captcha-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'captcha-modal';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'captcha-modal-text';
        messageDiv.textContent = message;

        const boxesContainer = document.createElement('div');
        boxesContainer.className = 'captcha-boxes';

        buttons.forEach(buttonValue => {
            const box = document.createElement('div');
            box.className = 'captcha-box';
            box.textContent = buttonValue;

            box.addEventListener('click', () => {
                if (buttonValue === correctAnswer) {
                    box.classList.add('correct');

                    setTimeout(() => {
                        document.body.removeChild(overlay);
                        styleSheet.remove();
                        success();
                    }, 500);
                } else {
                    box.classList.add('incorrect');

                    setTimeout(() => {
                        document.body.removeChild(overlay);
                        styleSheet.remove();
                        error();
                    }, 500);
                }
            });

            boxesContainer.appendChild(box);
        });

        modal.appendChild(messageDiv);
        modal.appendChild(boxesContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', e => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                styleSheet.remove();
                error();
            }
        });
    },
};
