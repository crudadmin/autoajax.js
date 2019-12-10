# AutoAjax.js
This package builds and sends ajax requests from `<form>` inputs. Then automatically receives upcoming validated request and provide automatical error messages management with all events required for Ajax management. Suitable for **Laravel** or plain **PHP**.

**This is part of package** for implementation in **JavaScript / VueJs** application side. More for PHP / Laravel side of this package on [autoAjax](https://github.com/crudadmin/autoajax)

## Features
- Automatically builds request data from `<form>` input elements.
- Handles Laravel validation and automatically binds error messages to each input in form.
- VueJs integration
- PlainJs integration

### Installation via NPM
`npm i autoajax --save`

### Basic installation
```html
<!-- jQuery and jQuery form -->
<script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.form/3.50/jquery.form.min.js"></script>

<!-- autoAjax.min.js -->
<script src="dist/autoAjax.min.js"></script>
```

# VueJs Integration
```js
var autoAjax = require('autoajax');

Vue.use(autoAjax);
```

### Initializing autoAjax form in VueJS
If you want initialize autoAjax form in VueJS component, you need use `v-autoAjax` directive in form element.
```html
<template>
    <form method="post" action="/contact" v-autoAjax="formOptions" @onSuccess="successEvent" @onValidation="validationEvent" @onError="errorEvent">
        <div class="form-group">
            <input type="text" name="email">
        </div>
        <div class="form-group">
            <textarea name="content"></textarea>
        </div>
        <div class="form-group">
            <button type="submit">submit form</button>
        </div>
    </form>
</template>

<script>
export default {
    data: {
        formOptions : {
            //...
        }
    },
  
    methods: {
        successEvent(data, response) {
            console.log(data, response);
        },
        errorEvent(data, response) {
            console.log(data, response);
        },
        validationEvent(data, response) {
            console.log(data, response);
        }
    }
}
</script>
```

### VueJs directives
#### Form initialization
Basic autoAjax form initialization you can bind with:
```html
<form v-autoAjax></form>
```

For custom form options you can use directive with options parameter like:
```html
<form v-autoAjax="myFormOptions"></form>
```

#### Automatically reset input values on success response
```html
<form v-autoAjax v-autoReset></form>
```

### VueJs Events
This is list of available form events. Need to be placed in form element.


#### On every form submit
`@submit="mySubmitEvent"` or `@onSubmit="mySubmitEvent"`

#### Receiving success response data on **HTTP 200**
`@success="mySuccessEvent"` or `@onSuccess="mySuccessEvent"`

#### Receiving error response data on **HTTP 500** and other error codes.
`@error="myErrorEvent"` or `@onError="myErrorEvent"`

#### On (laravel) validation error **HTTP 422** or **HTTP 430** error code
`@validation="myValidationErrorEvent"` or `@onValidation="myValidationErrorEvent"`


# Plain JavaScript Integration

### Initializing autoAjax form instance in plain JS
If you want initialize autoAjax form, you need use `autoAjax` class on form element.
```html
<form method="post" action="/contact" class="autoAjax">
    <div class="form-group">
        <input type="text" name="email">
    </div>
    <div class="form-group">
        <textarea name="content"></textarea>
    </div>
    <div class="form-group">
        <button type="submit">submit form</button>
    </div>
</form>

<script>
$(function(){
    var options = {
        //...
        onSubmit : function(data, response){},
        onSuccess : function(data, response){},
        onError : function(data, response){},
        onValidation : function(data, response){},
    };
    
    $('form.autoAjax').autoAjax(options)
});
</script>
```

#### Available classes for HTML forms
`autoAjax` - initialize autoAjax instance

`autoReset` - resets form values after success message

`noValidationMessage` - disables validation alert message.

# AutoAjax Options
AutoAjax options can be applied in VueJs directive `v-autoAjax="myOptions"` or in jQuery initialization autoAjax on form element `$('#myForm').autoAjax({ ... })`. This options will be applied only on selected form instance.

```js
var options = {
    //Automaticaly add validation errors to each input
    validationInputErrors : true,
    
    //Automaticaly add validation error message into form message element
    validationMessage : true,
    
    //All available messages
    messages : {
        error : 'Something went wrong, please try again later.',
        validation: 'Please fill all required fields.',
    },
       
    //Event on every form submit
    onSubmit() => {},
    
    //Event on success response (HTTP 200)
    onSuccess() => {},
    
    //Event on error response
    onError() => {},
    
    //Event on validation response
    onValidation() => {},
    
    //Generate error message for input element
    getErrorMessageElement(message, key, form) {
        return '<span class="error-message error">'+message+'</span>';
    }
}
```

# AutoAjax global options
You can mutate global AutoAjax options for all form instances.
```js
autoAjax.setOptions({
    //Other settings from autoAjax options
    //..
    
    //Custom message
    messages: {
        error : 'My custom global error message',
    },
    
    //Custom error message element
    getErrorMessageElement(message){
        return '<span class="my-custom-error-message error">'+message+'</span>';
    }
});
```
