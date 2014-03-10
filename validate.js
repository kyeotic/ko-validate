var defaultMessage = 'Invalid Value',
    defaultValidator = function (value) {
        return value !== undefined && value !== null && (value.length === undefined || value.length > 0);
    };

var getValidationFunction = function (validator) {

    //Allow Regex validations
    if (validator instanceof RegExp) {
        var validationRegex = validator;
        validator = function (value) {
            return value !== undefined && value !== null && validationRegex.test(value);
        };
        return validator;
    }

    if (typeof validator === 'object') {
        var validation = validator;
        validator = function (value) {
            var passed = true,
                    valueFloat = parseFloat(value, 10);

            //If we require numbers, we use a parsed value, any isNaN is a failure
            if (validation.min && (valueFloat < ko.unwrap(validation.min) || isNaN(valueFloat)))
                passed = false;
            if (validation.max && (valueFloat > ko.unwrap(validation.max) || isNaN(valueFloat)))
                passed = false;

            if (validation.minLength && value.length < ko.unwrap(validation.minLength))
                passed = false;
            if (validation.maxLength && value.length > ko.unwrap(validation.maxLength))
                passed = false;

            var options = ko.unwrap(validation.options);
            if (options && options instanceof Array && options.indexOf(value) === -1)
                passed = false;

            return passed;
        };
    }

    //If validator isn't regex or function, provide default validation
    return typeof validator === 'function' ? validator : defaultValidator;
};

var getValidation = function (validator) {
    var message = defaultMessage,
            handler;

    if (typeof validator === 'object') {
        if (validator.message)
            message = validator.message;
        handler = getValidationFunction(validator.validate);
    } else {
        handler = getValidationFunction(validator);
    }

    return {
        validate: handler,
        message: message
    };
};

ko.extenders.isValid = function (target, validator) {
    //Use for tracking whether validation should be used
    //The validate binding will init this on blur, and clear it on focus
    //So that editing the field immediately clears errors
    target.isModified = ko.observable(false);

    var validations = [];

    if (validator instanceof Array) {
        validator.forEach(function (v) {
            validations.push(getValidation(v));
        });
    } else {
        validations.push(getValidation(validator));
    }

    //We need to track both failure and the message in one step
    //Having one set the other feels odd, and having both run through
    //All the validation methods is inefficient.
    var error = ko.computed(function () {
        var value = target();
        //We want just the first failing validation, but we want to run
        //All the functions to establish an closed-over dependencies that might exist
        //in each function. We are trading performance for additional flexiblity here.
        var result = validations.filter(function (validation) {
            return !validation.validate(value);
        });

        return result.length > 0 ? result[0] : undefined;
    });

    target.isValid = ko.computed(function () {
        return error() === undefined;
    });

    target.errorMessage = ko.computed(function () {
        return error() !== undefined ? ko.unwrap(error().message) : '';
    });

    //Just a convienient wrapper to bind against for error displays
    //Will only show errors if validation is active AND invalid
    target.showError = ko.computed(function () {
        var active = target.isModified(),
                isValid = target.isValid();
        return active && !isValid;
    });

    return target;
};

  //Just activate whatever observable is given to us on first blur
ko.bindingHandlers.validate = {
    init: function (element, valueAccessor) {
        if (!ko.isObservable(valueAccessor()))
            throw new Error("The validate binding cannot be used with non-observables.");

        ko.bindingHandlers.value.init.apply(this, arguments); //Wrap value init

        //Starting the input with validation errors is bad
        //We will activate the validation after the user has done something
        //Select's get change raised when OPTIONS are bound, which is very common
            //We don't want that to activate validation
        if (element.nodeName.toLowerCase() === "select") {
            valueAccessor().__selectInit = false;
        }

        //Active will remain false until we have left the field
        ko.utils.registerEventHandler(element, 'blur', function () {
            valueAccessor().isModified(true);
        });
    },
    update: function (element, valueAccessor) {
        //Input's get activated on blur, not update
        if (element.nodeName.toLowerCase() === "select") {
            //The update handler runs on INIT, so we need a way to skip the 1st time only
            if (!valueAccessor().__selectInit)
                valueAccessor().__selectInit = true;
            else
                valueAccessor().isModified(true);
        }
        ko.bindingHandlers.value.update.apply(this, arguments); //just wrap the update binding handler
    }
};
