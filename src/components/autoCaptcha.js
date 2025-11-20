import { throttle } from 'lodash';

const allowers = {
    allowAfterMouseEnter(form) {
        form.addEventListener('mouseenter', e => {
            setTimeout(() => {
                this.allowAction(form, 'mouseenter');
            }, 5000);
        });

        form.addEventListener('touchstart', e => {
            setTimeout(() => {
                this.allowAction(form, 'touchstart');
            }, 1000);
        });
    },
    allowAfterMouseActivity(form) {
        let counter = 0;

        // Retrieve count of all interactive elements
        let interactiveElements = form.querySelectorAll(
                'input:not([type]), input[type="text"], input[type="email"], input[type="password"], input[type="number"], textarea, select'
            ),
            interactiveElementsCount = interactiveElements.length;

        form.addEventListener(
            'mousemove',
            throttle(e => {
                counter++;

                if (counter >= interactiveElementsCount) {
                    this.allowAction(
                        form,
                        'mouseActivity:' + interactiveElementsCount
                    );
                }
            }, 300)
        );
    },
    allowAction(form, enablerName) {
        let enabler = form.querySelector('input[name="_captcha_enabler"]');

        if (enabler) {
            return;
        }

        form.autoAjaxOptions.autoCaptcha.enabled = true;

        form.removeAttribute('action');

        form.setAttribute(
            'data-action',
            form.autoAjaxOptions.autoCaptcha.action
        );

        // Add enabler element
        let hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = '_captcha_enabler';
        hidden.value = enablerName;

        form.appendChild(hidden);
    },
};

var autoCaptcha = {
    register(form, options) {
        let originalAction =
            form.getAttribute('action') || form.getAttribute('data-action');

        options = Object.assign({}, options || {});

        form.autoAjaxOptions.autoCaptcha = {
            enabled: false,
            error: options.error || null,
            action: originalAction,
        };

        form.action = 'null';
        form.setAttribute('data-action', 'null');

        // Add delay after a long mouse enter event
        allowers.allowAfterMouseEnter(form);
        allowers.allowAfterMouseActivity(form);
    },
    onError(form) {
        if (typeof form.autoAjaxOptions.autoCaptcha.error === 'function') {
            form.autoAjaxOptions.autoCaptcha.error(() => {
                allowers.allowAction(form, 'captcha_modal');
            });
        } else {
            console.error('AutoCaptcha is not allowed yet');
        }
    },
};

export default autoCaptcha;
