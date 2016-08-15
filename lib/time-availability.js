$(document).ready(function () {
  $.fn.createAvailability = function createAvailability(options) {

    <!-- Helper -->
    function leftPadZeros(number, padString, length) {
      var str = number.toString();
      while (str.length < length) {
        str = padString + str;
      }
      return str;
    }

    function convertIntegerToDateFormat(value) {
      var formatValue;
      var hourValue;
      var minuteValue;
      var dayTimeValue;
      var length = value.toString().length;
      var minutes = value.toString().substr(length - 2, length);

      if (value >= 0 && value < 100) {
        dayTimeValue = ' AM';
        hourValue = 12;
        minuteValue = minutes;
      }
      else if (value >= 1200 && value < 1300) {
        dayTimeValue = ' PM';
        hourValue = Math.floor(value / 100);
        minuteValue = minutes;
      }
      else if (value == 2400) {
        dayTimeValue = ' AM';
        hourValue = 0;
        minuteValue = 0;
      } else if (value >= 1300) {
        dayTimeValue = ' PM';
        hourValue = Math.floor(value / 100) - 12;
        minuteValue = minutes;
      }
      else {
        dayTimeValue = ' AM';
        hourValue = Math.floor(value / 100);
        minuteValue = minutes;
      }

      formatValue = leftPadZeros(hourValue, 0, 2) + ':' + leftPadZeros(minuteValue, 0, 2) + dayTimeValue;
      return formatValue;
    }

    function generateTimeSeries(_this) {
      var stepValue = 60 / _this.slotInMinutes;

      _this.fromValues = [];
      _this.toValues = [];
      _this.totalValues = [];

      <!-- Hour clock -->
      for (var hourIndex = 0; hourIndex < 2400; hourIndex = hourIndex + 100) {
        var minuteIndex = 0;

        <!-- Minute clock -->
        for (var minuteIndex = 0; minuteIndex < stepValue; minuteIndex++) {
          var value = hourIndex + _this.slotInMinutes * minuteIndex;
          _this.fromValues.push(value);
          _this.toValues.push(value);
          _this.totalValues.push(value);
        }
      }

      _this.toValues.shift();
      _this.toValues.push(2400);

      return _this;
    }

    function isAM(time) {
      return (time.indexOf('am') != -1)
    }

    function isPM(time) {
      return !isAM(time);
    }

    function convertFormatToInteger(formatValue) {
      var lowerCaseFormatValue = formatValue.toLowerCase();
      var array = lowerCaseFormatValue.split(':');
      var hour = parseInt(array[0]);
      var minutes = parseInt(array[1]);
      var value;

      if (hour == 12 && isAM(lowerCaseFormatValue)) {
        value = minutes;
      }
      else if ((hour == 12 && isPM(lowerCaseFormatValue))) {
        value = (hour * 100) + minutes;
      }
      else if (hour == 0 && minutes == 0 && isAM(lowerCaseFormatValue)) {
        value = 2400;
      } else if (isPM(lowerCaseFormatValue)) {
        value = ((hour + 12) * 100) + minutes;
      }
      else {
        value = (hour * 100) + minutes;
      }

      return value;
    }

    function convertFormatToIntegerArray(selectedValues) {
      return selectedValues.map(function (value) {
        return $.map(value, function (range) {
          return convertFormatToInteger(range);
        })
      })
    }

    function convertStringToClass(string) {
      return '.' + string;
    }

    var defaults = {
      minutes: 30,
      disabled: false,
      isPrependTemplate: true,
      fromTimeEle: 'from-time',
      toTimeEle: 'to-time',
      timeSelectedArea: 'time-selected-area',
      removeAvailabilityEle: 'remove-availability',
      timeSlotEle: 'time-slot',
      inputFromTimeEle: 'input-from-time',
      inputToTimeEle: 'input-to-time',
      addAvailabilityEle: 'add-availability',
      optionTemplate: '<option></option>',
      template: "<div class='time-selected-area'>" +
      "from <select class='from-time'>test</select>" +
      "to <select class='to-time'></select>" +
      "<button class='add-availability'>Add</button></div>",
      selectedTemplate: "<div class='time-slot'>" +
      "from <input class='input-from-time' disabled='disabled' />" +
      "to <input class='input-to-time' disabled='disabled' />" +
      "<button class='remove-availability'>" +
      "X" +
      "</button>" +
      "</div>",
      values: []
    };

    var settings = $.extend({}, defaults, options);
    this.each(function (index, ele) {
      var _this = ele;

      var selectedItemOptions = {
        minutes: $(_this).data('minutes'),
        isPrependTemplate: $(_this).data('prepend-template'),
        disabled: $(_this).data('to-disabled'),
        fromTimeEle: $(_this).data('from-time'),
        toTimeEle: $(_this).data('to-time'),
        timeSelectedArea: $(_this).data('time-selected-area'),
        removeAvailabilityEle: $(_this).data('remove-availability'),
        timeSlotEle: $(_this).data('time-slot'),
        inputFromTimeEle: $(_this).data('input-from-time'),
        inputToTimeEle: $(_this).data('input-to-time'),
        addAvailabilityEle: $(_this).data('add-availability'),
        optionTemplate: $(_this).data('options'),
        selectedTemplate: $(_this).data('selectedTemplate'),
        template: $(_this).data('template'),
        values: $(_this).data('values')
      };

      var selectedOptions = $.extend({}, settings, selectedItemOptions);

      // var prepend_template = true;
      _this.selectedValues = convertFormatToIntegerArray(selectedOptions.values);
      _this.selectedTemplate = selectedOptions.selectedTemplate;
      _this.slotInMinutes = selectedOptions.minutes;
      _this.isPrependTemplate = selectedOptions.isPrependTemplate;
      _this.disabled = selectedOptions.disabled;
      _this.removeAvailabilityEle = selectedOptions.removeAvailabilityEle;
      _this.timeSlotEle = selectedOptions.timeSlotEle;
      _this.inputFromTimeEle = selectedOptions.inputFromTimeEle;
      _this.inputToTimeEle = selectedOptions.inputToTimeEle;
      _this.addAvailabilityEle = selectedOptions.addAvailabilityEle;
      _this.optionTemplate = selectedOptions.optionTemplate;
      _this.template = selectedOptions.template;

      _this.template = $(_this).append(_this.template);
      _this.fromEle = $(_this.template).find(convertStringToClass(selectedOptions.fromTimeEle));
      _this.toEle = $(_this.template).find(convertStringToClass(selectedOptions.toTimeEle));
      _this.timeSelectedArea = $(_this.template).find(convertStringToClass(selectedOptions.timeSelectedArea));

      _this = generateTimeSeries(_this);

      function createDefaultAvailabilities() {
        _this.selectedValues.forEach(function (slot) {
          createSelectedTemplate(slot[0], slot[1]);
        })
      }

      function postValuesFromTime() {
        _this.fromEle.html('');

        _this.fromValues.forEach(function (fromValue) {
          if (!isSelectedFromValue(fromValue)) {
            var $option = $(_this.optionTemplate);
            $option.attr('value', fromValue);
            $option.html(convertIntegerToDateFormat(fromValue));
            _this.fromEle.append($option);
          }
        })
      }

      function isSelectedFromValue(value) {
        var isSelected = false;

        _this.selectedValues.forEach(function (selectedSlot) {
          if (selectedSlot[0] <= value && value < selectedSlot[1]) {
            isSelected = true;
          }
        });

        return isSelected;
      }

      function fromTimeEventChange() {
        var selectedFromTime = _this.fromEle.val();
        _this.toEle.removeAttr('disabled');
        postValuesToTime(selectedFromTime);
      }

      function postValuesToTime(fromValue) {
        var toSelectedValuesLocal = [];
        var flag = true;
        var index = 0;

        _this.toEle.html('');

        _this.toValues.forEach(function (toValue) {
          if (!isSelectedToValue(toValue) && toValue > fromValue) {
            toSelectedValuesLocal.push(toValue);
          }
        });

        toSelectedValuesLocal.forEach(function (toValue) {
          if (index == 0 || isConsecutiveSeries(toValue, toSelectedValuesLocal) && flag) {
            var $option = $(_this.optionTemplate);
            $option.attr('value', toValue);
            $option.html(convertIntegerToDateFormat(toValue));
            _this.toEle.append($option);

            index = 1;
          } else {
            flag = false;
          }
        })
      }

      function isConsecutiveSeries(value, series) {
        var prevExpectedVal = 0;
        var isEnable = false;

        for (var index = 0; index < _this.totalValues.length; index++) {
          if (value == _this.totalValues[index]) {
            prevExpectedVal = _this.totalValues[index - 1];
          }
          if (value == 2400) {
            prevExpectedVal = _this.totalValues[_this.totalValues.length - 1];
          }
        }

        for (var index = 0; index < series.length; index++) {
          if (series[index] == value) {
            isEnable = (series[index - 1] == prevExpectedVal);
          }
        }

        return isEnable;
      }

      function isSelectedToValue(value) {
        var isSelected = false;

        _this.selectedValues.forEach(function (selectedSlot) {
          if (selectedSlot[0] < value && value <= selectedSlot[1]) {
            isSelected = true;
          }
        });
        return isSelected;
      }

      function selectedTemplateFormat(fromTime, toTime) {
        var $selectedTemplate = $(_this.selectedTemplate);

        $selectedTemplate.find(convertStringToClass(_this.inputFromTimeEle)).attr('data-raw-value', fromTime);
        $selectedTemplate.find(convertStringToClass(_this.inputToTimeEle)).attr('data-raw-value', toTime);
        $selectedTemplate.find(convertStringToClass(_this.inputFromTimeEle)).attr('value', convertIntegerToDateFormat(fromTime));
        $selectedTemplate.find(convertStringToClass(_this.inputToTimeEle)).attr('value', convertIntegerToDateFormat(toTime));

        return $selectedTemplate;
      }

      function createSelectedTemplate(fromTime, toTime) {
        var selectedRange = [fromTime, toTime];
        var selectedTemplate = selectedTemplateFormat(fromTime, toTime);

        if (selectedOptions.isPrependTemplate) {
          _this.timeSelectedArea.prepend(selectedTemplate);
        } else {
          _this.timeSelectedArea.append(selectedTemplate);
        }

        var removeTimeEleBtn = _this.timeSelectedArea.find(convertStringToClass(selectedOptions.removeAvailabilityEle));
        removeTimeEleBtn.unbind('click');
        removeTimeEleBtn.bind('click', removeTimeAvailability);
        resetDropDowns();
      }

      function createTimeAvailability() {
        var fromTime = $(_this.fromEle).val();
        var toTime = $(_this.toEle).val();

        _this.selectedValues.push([fromTime, toTime]);
        createSelectedTemplate(fromTime, toTime);
      }

      function resetDropDowns() {
        _this.toEle.html('');
        postValuesFromTime();

        if (selectedOptions.disabled) {
          _this.toEle.attr('disabled', 'disabled');
        } else {
          fromTimeEventChange();
        }
      }

      function removeTimeAvailability(event) {

        var newSelectedList = [];
        var selectedEle = $(event.currentTarget).parent(convertStringToClass(selectedOptions.timeSlotEle));
        var fromTime = selectedEle.find(convertStringToClass(selectedOptions.inputFromTimeEle)).data('raw-value');
        var toTime = selectedEle.find(convertStringToClass(selectedOptions.inputToTimeEle)).data('raw-value');
        var selectedRange = [fromTime, toTime];

        _this.selectedValues.forEach(function (selectedSlot) {
          if (fromTime != selectedSlot[0] && toTime != selectedSlot[1]) {
            newSelectedList.push(selectedSlot);
          }
        });

        _this.selectedValues = newSelectedList;
        selectedEle.remove();
        resetDropDowns();
      }

      $(_this).find(convertStringToClass(selectedOptions.addAvailabilityEle)).click(createTimeAvailability);
      $(_this).find(convertStringToClass(selectedOptions.removeAvailabilityEle)).click(removeTimeAvailability);

      function defaultsLoad() {
        createDefaultAvailabilities();
        postValuesFromTime();
        $(_this.fromEle).change(fromTimeEventChange);
        resetDropDowns();
      }

      defaultsLoad();
    })
  };
});
