$(document).ready(function () {

    <!-- Helper -->
    function convertIntegerToDateFormat(value) {
        var formatValue;
        var length = value.toString().length;
        var minutes = value.toString().substr(length - 2, length);
        if (value >= 1300) {
            formatValue = (Math.round(value / 100) - 12) + ':' + minutes + ' PM';
        } else {
            formatValue = Math.round(value / 100) + ':' + minutes + ' AM';
        }

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

    function convertFormatToInteger(formatValue) {
        var lowerCaseFormatValue = formatValue.toLowerCase();
        var array = lowerCaseFormatValue.split(':');
        var hour = parseInt(array[0]);
        var minutes = parseInt(array[1]);
        var value;

        if (lowerCaseFormatValue.indexOf('am') == -1) {
            value = ((hour + 12) * 100) + minutes;
        } else {
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

    $.fn.createAvailability = function createAvailability() {
        this.each(function (index, ele) {
            var _this = ele;
            _this.fromEle = $(_this).find('.from-time');
            _this.toEle = $(_this).find('.to-time');
            _this.timeSelectedArea = $(_this).find('.time-selected-area');
            _this.selectedValues = convertFormatToIntegerArray($(_this).data('values'));
            _this.slotInMinutes = $(_this).data('minutes') || 30;
            _this = generateTimeSeries(_this);

            function createDefaultAvailabilities() {
                _this.selectedValues.forEach(function (slot) {
                    createTemplate(slot[0], slot[1]);
                })
            }

            function postValuesFromTime() {
                _this.fromEle.html('');

                _this.fromValues.forEach(function (fromValue) {
                    if (!isSelectedFromValue(fromValue)) {
                        _this.fromEle.append("<option value=" + fromValue + ">" + convertIntegerToDateFormat(fromValue) + "</option>");
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
                        _this.toEle.append("<option value=" + toValue + ">" + convertIntegerToDateFormat(toValue) + "</option>");
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
                var index = 0;

                _this.selectedValues.forEach(function (selectedSlot) {
                    if (selectedSlot[0] < value && value <= selectedSlot[1]) {
                        isSelected = true;
                    }
                });
                return isSelected;
            }

            function createTemplate(fromTime, toTime) {
                var selectedRange = [fromTime, toTime];

                var template = "<div class='time-slot'>" +
                    "from <input class='input-from-time' data-raw-value=" + fromTime + " value='" + convertIntegerToDateFormat(fromTime) + "' disabled='disabled' />" +
                    "to <input class='input-to-time' data-raw-value=" + toTime + " value='" + convertIntegerToDateFormat(toTime) + "' disabled='disabled' />" +
                    "<button class='remove-availability'>" +
                    "X" +
                    "</button>" +
                    "</div>";

                _this.timeSelectedArea.prepend(template);

                var removeTimeEleBtn = _this.timeSelectedArea.find('.remove-availability');
                removeTimeEleBtn.unbind('click');
                removeTimeEleBtn.bind('click', removeTimeAvailability);
                resetDropDowns();
            }

            function createTimeAvailability() {
                var fromTime = $(_this.fromEle).val();
                var toTime = $(_this.toEle).val();

                _this.selectedValues.push([fromTime, toTime]);
                createTemplate(fromTime, toTime);
            }

            function resetDropDowns() {
                _this.toEle.html('');
                postValuesFromTime();

                if ($(_this).data('to-disabled')) {
                    _this.toEle.attr('disabled', 'disabled');
                } else {
                    fromTimeEventChange();
                }
            }

            function removeTimeAvailability(event) {
                var newSelectedList = [];
                var selectedEle = $(event.currentTarget).parent('.time-slot');
                var fromTime = selectedEle.find('.input-from-time').data('raw-value');
                var toTime = selectedEle.find('.input-to-time').data('raw-value');
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

            $(_this).find('.add-availability').click(createTimeAvailability);
            $(_this).find('.remove-availability').click(removeTimeAvailability);

            function defaultsLoad() {
                createDefaultAvailabilities();
                postValuesFromTime();
                $(_this.fromEle).change(fromTimeEventChange);
                resetDropDowns();
            }

            defaultsLoad();
        })
    };

    $('.time-select').createAvailability();
});
