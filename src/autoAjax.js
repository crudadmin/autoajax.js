import { cloneDeep, isEqual, isArray, castArray } from 'lodash';

import resetsForm from './components/resetsForm';
import bindForm from './components/bindForm';
import ErrorMessage from './components/errorMessage';
import autoSave from './components/autoSave';
import autoCaptcha from './components/autoCaptcha';

var autoAjax = {
    options: {
        //Auto reset form on success
        autoReset: false,

        //Basic auto captcha mechanism
        autoCaptcha: false,

        //Automatically save all unsaved form changed
        autoSave: false,

        //Skip fields from autosave
        autoSaveSkip: ['g-recaptcha-response'],

        //Automaticaly add validation error messages after each bad filled input
        showInputErrors: true,

        //Automatically bind validation message
        showValidationMessage: true,

        //Available selectors and classes
        selectors: {
            inputWrapperErrorClass: 'has-error',
        },

        //Global messages
        messages: {
            error: 'Something went wrong, please try again later.',
            validation: 'Please fill all required fields.',
        },

        //Scrolling on wrong input elements
        scrollOnErrorInput: true,
        errorInputScrollSpeed: 500,
        errorInputScrollOffset: 100,
        focusWrongTextInput: true,

        onCreate(form) {},
        data(data) {},
        submit(form) {},
        success(data, response, form) {},
        error(data, response, form) {},
        validation(data, response, form) {},

        //Build validation error message
        getErrorMessageElement(message, key, form) {
            return '<span class="help-block error">' + message + '</span>';
        },

        //Add validation error message after this element
        addErrorMessageAfterElement(input) {
            //You can modify, where should be placed validation error message for each input
            //If you want place validation after input parent, you can do something like:
            //return input.parentElement;

            return input;
        },

        //Returns input parrent wrapper where .has-error class will be added
        getInputParentWrapper(input) {
            return input.parentElement;
        },

        //Find form keys by
        findFormField(form, key) {
            // prettier-ignore
            let selectors = [
                'input[name="' +key +'"], select[name="' +key +'"], textarea[name="' +key +'"], [data-virtual-input="'+key+'"]',
                'input[name="' +key +'[]"], select[name="' +key +'[]"], textarea[name="' +key +'[]"], [data-virtual-input="'+key+'[]"]',
            ].join(', ');

            var formId = form.getAttribute('id'),
                //Find input in existing form
                inputs = form.querySelectorAll(selectors);

            if (inputs.length == 0 && formId) {
                //Find input in whole document, assigned to form elsewhere in document by form="" attribute
                inputs = [...document.querySelectorAll(selectors)].filter(
                    el => {
                        return el.getAttribute('form') == formId;
                    }
                );
            }

            return [...inputs];
        },

        //Global callback events for every form, such as validation, error handling etc...
        globalEvents: {
            success: [
                (data, response, form) => {
                    var options = autoAjax.core.getFormOptions(form),
                        canResetForm =
                            form.classList.contains('autoReset') ||
                            options.autoReset === true;

                    //Reset form on success message if has autoReset class
                    if (canResetForm && !('error' in response)) {
                        resetsForm.resetForm(form);
                    }

                    //Does not process success events if returned data is not object type
                    if (typeof data != 'object') return;

                    //Redirect on callback
                    if ('redirect' in data && data.redirect) {
                        if (data.redirect == window.location.href) {
                            return window.location.reload();
                        }

                        window.location.href = data.redirect;
                    }
                },
            ],
            error: [(data, response, form) => {}],
            validation: [
                (data, response, form) => {
                    var options = autoAjax.core.getFormOptions(form);

                    if (response.status == 422) {
                        let errors = {};

                        //Laravel 5.5+ provides validation errors in errors object.
                        if ('errors' in data && !('length' in data.errors)) {
                            errors = data.errors;
                        }

                        //We want sorted keys by form positions, not backend validation positions
                        //Because of scrolling to field in right order
                        let keys = autoAjax.core.sortKeysByFormOrder(
                            form,
                            errors
                        );

                        for (var i = 0; i < keys.length; i++) {
                            let key = keys[i],
                                message = isArray(errors[key])
                                    ? errors[key][0]
                                    : errors[key];

                            new ErrorMessage(
                                autoAjax,
                                options,
                                form,
                                key,
                                message
                            ).setErrorMessage();
                        }
                    }
                },
            ],
        },
    },

    core: {
        /*
         * Return form options
         */
        getFormOptions(form) {
            var options = (form.tagName == 'FORM' ? form : form[0])
                .autoAjaxOptions;

            return options || {};
        },
        /*
         * Merge actual options with new given options
         * Rewrite properties in object in second level, and does not
         * throw away whole parent object, when one attribute is changed
         */
        mergeOptions(oldOptions, newOptions) {
            for (var k in newOptions) {
                if (
                    typeof newOptions[k] === 'object' &&
                    !newOptions[k].length
                ) {
                    for (var k1 in newOptions[k]) {
                        if (!(k in oldOptions)) {
                            oldOptions[k] = newOptions[k];
                            break;
                        }

                        oldOptions[k][k1] = newOptions[k][k1];
                    }
                } else {
                    oldOptions[k] = newOptions[k];
                }
            }

            return oldOptions;
        },
        /**
         * Reset all errors
         *
         * @param  element  form
         */
        resetErrors: function(form) {
            var options = autoAjax.core.getFormOptions(form);

            //Remove added error messages
            if (form[0]._addedErrorMessages) {
                for (var i = 0; i < form[0]._addedErrorMessages.length; i++) {
                    form[0]._addedErrorMessages[i].remove();
                }
            }

            let classes = autoAjax.core
                    .getClass('inputWrapperErrorClass', form)
                    .split(' ')
                    .map(c => (c.includes('.') ? c : '.' + c)),
                selector = classes.join('');

            //Remove input wrapper class
            form.querySelectorAll(selector).forEach(wrapper => {
                classes.forEach(c => {
                    if (wrapper) {
                        wrapper.classList.remove(c.replace('.', ''));
                    }
                });
            });
        },
        getClass(key, form, onlyString) {
            var options = autoAjax.core.getFormOptions(form),
                selector = options.selectors[key];

            if (onlyString === true) {
                selector = selector.replace(/\./g, '');
            }

            return selector;
        },
        fireEventsOn(functions, parameters) {
            let response;

            castArray(functions).forEach(callbacks => {
                castArray(callbacks)
                    .filter(item => typeof item == 'function')
                    .forEach(callback => {
                        response = callback(...parameters) || response;
                    });
            });

            return response;
        },
        /*
         * Return correct ajax response
         */
        ajaxResponse(response, form) {
            var options = form.autoAjaxOptions,
                finalResponse = [
                    response ? response.data : null,
                    response,
                    form,
                ],
                status = response ? response.status : null;

            //Set ajax status as done
            autoAjax.core.setLoading(form, false);

            //On success response
            if ([200, 201].includes(status)) {
                this.fireEventsOn(
                    [options.success, options.globalEvents.success],
                    finalResponse
                );
            }

            //On validation error
            else if ([422].includes(status)) {
                this.fireEventsOn(
                    [options.validation, options.globalEvents.validation],
                    finalResponse
                );
            }

            //Other error
            else {
                this.fireEventsOn(
                    [options.error, options.globalEvents.error],
                    finalResponse
                );
            }

            //On complete request
            this.fireEventsOn(
                [options.complete, options.globalEvents.complete],
                finalResponse
            );
        },
        /*
         * Set loading status of form
         */
        setLoading(form, state) {
            if (!form.vnode) {
                return;
            }

            let props =
                form.vnode && form.vnode.data
                    ? form.vnode.data.on
                    : form.vnode.props;

            if (props && (props.loading || props.onLoading)) {
                props[props.loading ? 'loading' : 'onLoading'](state);
            }

            if (form && form.autoAjaxOptions) {
                form.autoAjaxOptions.loading = state;
            }
        },
        getFormKeyIndex(formKeys, key) {
            var index;

            //Find basic key, or multiple field name[]
            index = formKeys.indexOf(key);
            index = index == -1 ? formKeys.indexOf(key + '[]') : index;
            if (index !== -1) {
                return index;
            }

            //If field has not been found, we want scroll to this field at the last position
            return 9999;
        },
        /*
         * Get keys from request in correct order by fields position in form
         */
        sortKeysByFormOrder(form, obj) {
            var formKeys = [
                ...form.querySelectorAll(
                    'input[name], textarea[name], select[name]'
                ),
            ]
                .map(el => el.getAttribute('name'))
                .filter(name => name);

            var newObjectKeys = Object.keys(obj || []).sort((a, b) => {
                return (
                    this.getFormKeyIndex(formKeys, a) -
                    this.getFormKeyIndex(formKeys, b)
                );
            });

            return newObjectKeys;
        },
    },

    setOptions(options) {
        autoAjax.core.mergeOptions(autoAjax.options, options);

        return this;
    },

    flushAutoSave() {
        autoSave.flushData();
    },

    /*
     * Add support for vuejs 2 and vuejs 3
     */
    tryNextTick(vnode, callback) {
        if (vnode.context) {
            vnode.context.$nextTick(callback);
        } else {
            callback();
        }
    },

    /**
     * Vuejs 2/3 callback
     */
    onMounted(callback) {
        return {
            bind: callback,
            mounted: callback,
        };
    },

    /**
     * Vuejs 2/3 callback
     */
    onUpdated(callback) {
        return {
            update: callback,
            updated: callback,
        };
    },

    /*
     * Create installable vuejs package
     */
    install(Vue, options) {
        Vue.directive('autoAjax', {
            ...autoAjax.onMounted((el, binding, vnode, oldVnode) => {
                var options = binding.value || {},
                    on = vnode.data ? vnode.data.on || {} : vnode.props,
                    mergedOptions = autoAjax.core.mergeOptions(
                        {
                            //Bind Vuejs events
                            submit: [
                                on.submit,
                                on.onSubmit,
                                autoAjax.options.submit,
                            ],
                            success: [
                                on.success,
                                on.onSuccess,
                                autoAjax.options.success,
                            ],
                            error: [
                                on.error,
                                on.onError,
                                autoAjax.options.error,
                            ],
                            validation: [
                                on.validation,
                                on.onValidation,
                                autoAjax.options.validation,
                            ],
                            complete: [
                                on.complete,
                                on.onComplete,
                                autoAjax.options.complete,
                            ],
                            data: [on.data, on.onData, autoAjax.options.data],
                        },
                        options
                    );

                //Set vnode of element
                el.vnode = vnode;

                this.registerFormSubmit(el, mergedOptions);

                resetsForm.init(el);
            }),
            ...autoAjax.onUpdated((el, binding, vnode) => {
                //If value has not been changed
                if (
                    !binding.oldValue ||
                    isEqual(binding.value, binding.oldValue)
                ) {
                    return;
                }

                el.autoAjaxOptions = autoAjax.core.mergeOptions(
                    el.autoAjaxOptions,
                    binding.value || {}
                );
            }),
        });

        Vue.directive('autoCaptcha', {
            ...autoAjax.onMounted((el, binding, vnode) => {
                autoAjax.tryNextTick(vnode, () => {
                    autoCaptcha.register(
                        el,
                        this.getFormAction(el),
                        binding.value
                    );
                });
            }),
        });

        Vue.directive('autoReset', {
            ...autoAjax.onMounted((el, binding, vnode) => {
                autoAjax.tryNextTick(vnode, () => {
                    el.autoAjaxOptions.autoReset = true;
                });
            }),
            ...autoAjax.onUpdated((el, binding, vnode) => {
                if (el.autoAjaxOptions) {
                    el.autoAjaxOptions.autoReset =
                        binding.value === false ? false : true;
                }
            }),
        });

        ['autoAjaxRow', 'bindRow', 'row'].forEach(key => {
            Vue.directive(key, {
                ...autoAjax.onMounted((el, binding, vnode) => {
                    autoAjax.tryNextTick(vnode, () => {
                        var options = autoAjax.core.getFormOptions(el);

                        if (binding.value) {
                            bindForm.bindRow(el, binding.value, options);

                            //Bind form also second time after 100ms, because Vuejs may not be ready yet. So we may try bind again...
                            //This happens when in form we have sub components with slots. (2 nested slots),
                            //then value in slot will not be ready on mounted state.
                            setTimeout(() => {
                                bindForm.bindRow(el, binding.value, options);
                            }, 50);
                        }
                    });
                }),
                ...autoAjax.onUpdated((el, binding, vnode) => {
                    //If row does not have previous value
                    if (isEqual(binding.value, binding.oldValue)) {
                        return;
                    }

                    //If value has been reseted
                    if (binding.value === null) {
                        resetsForm.resetForm(el);
                    }

                    //If row has been changed
                    else {
                        var options = autoAjax.core.getFormOptions(el);

                        bindForm.bindRow(el, binding.value || {}, options);
                    }
                }),
            });
        });
    },
    buildFromData(form, options) {
        const data = new FormData(form);

        let append =
            autoAjax.core.fireEventsOn(
                [options.data, options.globalEvents.data],
                [data]
            ) || {};

        const obj2FormData = (obj, formData = new FormData()) => {
            const createFormData = function(obj, subKeyStr = '') {
                for (let k in obj) {
                    let value = obj[k];
                    let subKeyStrTrans = subKeyStr
                        ? subKeyStr + '[' + k + ']'
                        : k;

                    if (['string', 'number'].includes(typeof value)) {
                        formData.append(subKeyStrTrans, value);
                    } else if (['boolean'].includes(typeof value)) {
                        formData.append(subKeyStrTrans, value ? 1 : 0);
                    } else if (typeof value === 'object') {
                        createFormData(value, subKeyStrTrans);
                    }
                }
            };

            createFormData(obj);

            return formData;
        };

        //Add append data into form
        obj2FormData(append, data);

        return data;
    },
    getFormAction(form) {
        return (
            form.getAttribute('action') ||
            form.getAttribute('data-action') ||
            form.action
        );
    },
    registerFormSubmit(form, options) {
        form.autoAjaxOptions = options = Object.assign(
            autoAjax.core.mergeOptions(cloneDeep(autoAjax.options), options),
            {
                loading: false,
            }
        );

        form.addEventListener('submit', e => {
            const data = this.buildFromData(form, options),
                method = form.method,
                action = this.getFormAction(form);

            const fire = async () => {
                autoAjax.core.setLoading(form, true);

                autoAjax.core.resetErrors(form);

                try {
                    let response = await options.process(method, action, data);

                    autoAjax.core.ajaxResponse(response, form);
                } catch (e) {
                    console.error(e);

                    autoAjax.core.ajaxResponse(e.response, form);
                }

                autoAjax.core.setLoading(form, false);
            };

            if (options.autoCaptcha && options.autoCaptcha.enabled === false) {
                autoCaptcha.onError(form);
            } else if (form.autoAjaxOptions.loading !== true) {
                fire();
            }

            e.preventDefault();
        });
    },
    jQueryDirective(_window) {
        if (!_window || !(typeof _window == 'object')) {
            return;
        }

        _window.$.fn.autoAjax = function(options) {
            return $(this).each(function() {
                // //If form has been initialized already
                // if ( this.autoAjaxOptions )
                //     return;

                // var defaultOptions = cloneDeep(autoAjax.options);

                // //Bind ajax options into exact form
                // this.autoAjaxOptions = Object.assign(autoAjax.core.mergeOptions(defaultOptions, options), {
                //     status : 'ready',
                // });

                //Bind given row data and datepicker
                // resetsForm.init(this);
                // bindForm.init(this);

                // autoSave.formAutoSave(this, this.autoAjaxOptions);
                // bindForm.bindRow(this, null, this.autoAjaxOptions);
                // bindForm.bindDatepickers(this);

                /*
                 * After submit form
                 */
                $(this).submit(function() {
                    var form = $(this);

                    this.scrolledOnWrongInput = false;

                    //Fire submit event
                    autoAjax.core.fireEventsOn(
                        [
                            this.autoAjaxOptions.submit,
                            this.autoAjaxOptions.onSubmit,
                        ],
                        [form]
                    );

                    // form.ajaxSubmit({
                    //   url: form.attr('action') || form.attr('data-action'),
                    //   success: (data, type, response) => autoAjax.core.ajaxResponse(response, form),
                    //   error: response => autoAjax.core.ajaxResponse(response, form),
                    // });

                    return false;
                });

                //Fire autoAjax init event
                autoAjax.core.fireEventsOn(
                    [
                        this.autoAjaxOptions.create,
                        this.autoAjaxOptions.onCreate,
                    ],
                    [$(this)]
                );
            });
        };
    },
};

export default autoAjax;
