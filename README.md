ko-validate
===========

###The binding handler
`<input type="text" data-bind="validate: title" />`

`validate` wraps the standard `value` binding, and sets the `isModified` sub-observable on the extended observable. This stops errors from showing before the element has been ineteracted with.

### The extender

Like ko-validation I use an extender, but unlike ko-validation I use just one: `isValid`. It add's four sub-observables to the extended observable:

1. `isValid()` - boolean indicating the validity.
1. `isModified()` - boolean indicating whether the value has been touched. It is set to true by the  `validate` binding handler
1. `showError()` - boolean indicating whether the error message should be shown. It is `!isValid() && isModified()`.
1. `errorMessage()` - the error message to display.

It supports several syntaxes, ranging from "bare-minimum" to "totally customized."

####Just Required
`this.title = ko.observable().extend({ isValid: true});`

This will use the default validation method, `value !== undefined && value !== null && (value.length === undefined || value.length > 0)`, and uses the default message `Invalid Value`.

####Custom message
`this.title = ko.observable().extend({ isValid: { message: 'Error' } });`

Will use the default validation method, and show the specified error.

####Regex
`this.title = ko.observable().extend({ isValid: { validate: /^Home/}, message: 'must start with "Home"' });`

You can pass a regex to either the `validate` property, or to `isValid` (if you don't need to specify a message).
####Standard options
`this.title = ko.observable().extend({ isValid: { validate: { min: 2}, message: 'must be at least 2' });`

Passing an object to `validate` will create a validation function based on some standard properties. Currently, it supports the following options:

* `min` and `max`. Will check these values *as numbers*.
* `minLength` and `maxLength` will check these values *as strings*.
* `options` will check values against this *array*. Any value in the array is valid.

All of these can also be primitive or observable values. `validate` and `messsage` can (and probably should) both be passed to the extender.

####Custom validation
`this.title = ko.observable().extend({ isValid: { validate: function (value) { return value !== undefined && value instanceof Array; });`
If you pass a function to `validate` it will be used to test the validity of the observable. The function will recieve any value written, and the value will be invalid if the function returns `false`.

####Multiple validations
    self.payLow = ko.observable(data.payLow || 0).extend({
        numeric: { precision: 2, min: 0, max: payMax },
        isValid: [
            {
                validate: { min: 1 },
                message: 'Required'
            },
            {
                validate: { max: payMax },
                message: ko.computed(function() { return 'Must be at most $' + payMax(); })
            }
        ]
    });
    
The extender can also take an array of validation objects, each of which will be used to determine validity. The `errorMessage` sub-observable will be set to the message of the first failing specification only.
