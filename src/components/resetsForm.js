import observeDOM from './observeDOM';
import bindForm from './bindForm';
import { isNil } from 'lodash';

var resetsForm = {
    init(form) {
        this.saveDefaultRowValues(form);

        observeDOM(form, mutations => {
            this.saveDefaultRowValues(form);
        });
    },
    saveDefaultRowValues(form) {
        var values = {},
            inputs = [...form.querySelectorAll('input, textarea, select')];

        inputs.forEach(input => {
            //If default value has been saved already
            if (!isNil(input.autoAjaxDefaultValue)) {
                return;
            }

            let name = input.getAttribute('name'),
                value = input.value,
                defaultValue = null;

            if (['checkbox', 'radio'].includes(input.getAttribute('type'))) {
                defaultValue = input.checked ? true : false;
            } else {
                defaultValue = input.value;
            }

            input.autoAjaxDefaultValue = defaultValue;
        });

        form.autoAjaxOptions.defaultValues = values;
    },
    resetForm(form) {
        const resetInputs = [
            ...form.querySelectorAll('input, select, textarea'),
        ].filter(el => {
            if (['_token'].includes(el.getAttribute('name'))) {
                return false;
            }

            if (['submit', 'hidden'].includes(el.getAttribute('type'))) {
                return false;
            }

            return true;
        });

        resetInputs.forEach(input => {
            if (['checkbox', 'radio'].includes(input.getAttribute('type'))) {
                input.checked = input.autoAjaxDefaultValue;
            } else {
                input.value = input.autoAjaxDefaultValue;
            }
        });

        bindForm.triggerChangeEvent(resetInputs);
    },
};

export default resetsForm;
