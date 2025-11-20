import { castArray } from 'lodash';
import observeDOM from './observeDOM';

export default class ErrorMessage {
    constructor(autoAjax, options, form, key, message) {
        this.autoAjax = autoAjax;
        this.form = form;
        this.message = message;
        this.options = options;
        this.key = this.getParsedKey(key);
    }

    getParsedKey(key) {
        key = key
            .split('.')
            .map((value, index) => {
                return index == 0 ? value : '[' + value + ']';
            })
            .join('');

        return key;
    }

    getErrorInputElement(options, element, key, form) {
        let addAfterElement = options.addErrorMessageAfterElement(
            element,
            key,
            form
        );

        return castArray(addAfterElement);
    }

    getInputParentElementsWrappers(options, input) {
        let addAfterElement = options.getInputParentWrapper(input);

        return castArray(addAfterElement);
    }

    /*
     * Set input error message
     */
    setErrorMessage() {
        let options = this.options,
            key = this.key,
            form = this.form,
            autoAjax = this.autoAjax;

        var errorInputs = options.findFormField(form, key);

        //Scroll on first error element
        if (options.scrollOnErrorInput === true && errorInputs.length > 0) {
            this.scrollOnWrongInput(errorInputs, form, options);
        }

        //Add error message element after imput
        this.handleErrorInputMessages(errorInputs, options);

        //Add error class on input parent
        this.handleErrorInputChange(errorInputs, options);

        //Add error class on input wrapper
        errorInputs.forEach(input => {
            const wrapper = this.getInputParentElementsWrappers(
                options,
                input
            ).filter(item => item);

            wrapper.forEach(element => {
                autoAjax.core
                    .getClass('inputWrapperErrorClass', form, true)
                    .split(' ')
                    .forEach(c => {
                        element.classList.add(c);
                    });
            });
        });
    }

    handleErrorInputMessages(errorInputs, options) {
        if (options.showInputErrors !== true) {
            return;
        }

        let form = this.form,
            key = this.key,
            errorElementString = options.getErrorMessageElement(
                this.message,
                this.key,
                form
            );

        errorInputs.forEach(input => {
            var addAfterElement = this.getErrorInputElement(
                options,
                input,
                key,
                form
            );

            for (var i = 0; i < addAfterElement.length; i++) {
                let addAfter = addAfterElement[i],
                    nextElement = addAfter ? addAfter.nextElementSibling : null;

                //If input does not has bffer
                if (!input._addedErrorMesageIntoInput) {
                    input._addedErrorMesageIntoInput = [];
                }

                if (!addAfter) {
                    continue;
                }

                //If error message has not been already added on this place
                if (
                    !nextElement ||
                    nextElement.outerHTML !== errorElementString
                ) {
                    addAfter.insertAdjacentHTML('afterend', errorElementString);
                }

                //Add error message into buffer of actual input
                input._addedErrorMesageIntoInput.push(
                    addAfter.nextElementSibling
                );

                //If form does not have stack with error messages
                if (!form[0]._addedErrorMessages) {
                    form[0]._addedErrorMessages = [];
                }

                form[0]._addedErrorMessages.push(addAfter.nextElementSibling);
            }
        });
    }

    handleErrorInputChange(errorInputs, options) {
        //If input changes, remove errors
        ['keyup', 'change'].forEach(eName => {
            errorInputs.forEach(input => {
                input.addEventListener(eName, e => {
                    //On tab and esc does not remove errors
                    if (e.keyCode && [13, 9].indexOf(e.keyCode) > -1) {
                        return;
                    }

                    this.removeErrorMessages(errorInputs);
                });
            });
        });

        //Vuejs support, when :value has been changed, but event has not been dispatched
        observeDOM(
            errorInputs[0],
            mutations => {
                let diffMutations = mutations.filter(
                    mutation =>
                        mutation.attributeName == 'value' &&
                        errorInputs[0].value != mutation.oldValue
                );

                if (diffMutations.length > 0) {
                    this.removeErrorMessages(errorInputs);
                }
            },
            { attributes: true, attributeOldValue: true }
        );
    }

    removeErrorMessages(errorInputs) {
        var options = this.options,
            form = this.form,
            autoAjax = this.autoAjax;

        //We want remove all errors for input on multiple places. For example multiple checkbox.
        errorInputs.forEach(input => {
            //Remove all input messages
            if (input._addedErrorMesageIntoInput) {
                for (
                    var i = 0;
                    i < input._addedErrorMesageIntoInput.length;
                    i++
                ) {
                    input._addedErrorMesageIntoInput[i].remove();
                }

                //Reset array
                input._addedErrorMesageIntoInput = [];
            }

            //Remove parent error class
            this.getInputParentElementsWrappers(options, input).forEach(
                element => {
                    autoAjax.core
                        .getClass('inputWrapperErrorClass', form, true)
                        .split(' ')
                        .forEach(c => {
                            element.classList.remove(c);
                        });
                }
            );
        });
    }

    /*
     * Scroll on wrong input field an select it
     */
    scrollOnWrongInput(elements, form, options) {
        //We want support scroll on one of the multiple visible error element indicators
        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];

            if (form.scrolledOnWrongInput === true) {
                continue;
            }

            const isVisible = el => {
                return el.checkVisibility({
                    opacityProperty: true,
                    visibilityProperty: true,
                });
            };

            var top = this.getFieldScrollPosition(element, options),
                activeElement = document.activeElement,
                isHidden = !isVisible(element);

            //We does not want scrool if element is hidden
            if (top <= 0 || isHidden) {
                var parent = element.parentElement;

                //If field is hidden and parent group is visible
                if (isHidden && isVisible(parent)) {
                    top = this.getFieldScrollPosition(parent, options);
                }

                //If field does not have visible parent
                else {
                    continue;
                }
            }

            form.scrolledOnWrongInput = true;

            window.scrollTo({
                top: top,
                behavior: 'smooth',
            });

            //Focus wrong text inputs
            if (
                options.focusWrongTextInput === true && //If we can focus error inputs
                [
                    'text',
                    'email',
                    'number',
                    'phone',
                    'date',
                    'password',
                    'range',
                    'checkbox',
                ].includes(element.getAttribute('type')) && //If is text input
                !(
                    activeElement &&
                    (activeElement._addedErrorMesageIntoInput || []).length > 0
                ) //If is not select error input already
            ) {
                element.focus();
            }

            break;
        }

        form.scrolledOnWrongInput = true;
    }

    getFieldScrollPosition(element, options) {
        function getOffset(element) {
            if (!element.getClientRects().length) {
                return { top: 0, left: 0 };
            }

            let rect = element.getBoundingClientRect();
            let win = element.ownerDocument.defaultView;
            return {
                top: rect.top + win.pageYOffset,
                left: rect.left + win.pageXOffset,
            };
        }

        var top = getOffset(element).top,
            offset = options.errorInputScrollOffset;

        //Scroll offset can be dynamic function which returns number.
        //Because sometimes for mobile version, we want other offset.
        if (typeof offset == 'function') {
            offset = offset();
        }

        return top > offset ? top - offset : top;
    }
}
