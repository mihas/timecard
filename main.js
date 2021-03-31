// Example starter JavaScript for disabling form submissions if there are invalid fields
$(function () {
  'use strict'

  dayjs.extend(window.dayjs_plugin_customParseFormat);
  dayjs.extend(window.dayjs_plugin_duration);

  var searchParams = new URLSearchParams(window.location.search)
  var lockSettings = searchParams.get("lock_settings") === "true"

  var weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  // Show/hide am/pm select inputs based on selected Time format.

  var timeFormatSetting = $('input[id="time-format"]');
  var ampmSelectors = $('.ampm-select');

  var descSetting = $('input[id="description-setting"]');
  var descInputs = $('.description-hidden');

  var breakSetting = $('input[id="break-setting"]');
  var breakInputs = $('.second-column');

  var weekendSetting = $('input[id="weekend-setting"]');
  var weekendInputs = $('.weekend-hidden');

  function setSettingsViaURL(setting, urlVal) {
    if (typeof(urlVal) === "boolean") {
      setting.prop("checked", urlVal);
    }
  }

  setSettingsViaURL(timeFormatSetting, searchParams.get("24h_format") === "true");
  setSettingsViaURL(breakSetting, searchParams.get("add_breaks") === "true");
  setSettingsViaURL(weekendSetting, searchParams.get("show_weekend") === "true");

  if (lockSettings) {
    $(".lockable-input").prop("disabled", lockSettings);
  }

  var isAmPm = timeFormatSetting.prop("checked") == false;
  var noBreaks = breakSetting.prop("checked") == false;
  var noWeekends = weekendSetting.prop("checked") == false;

  function toggleChecked(val, inputs, isFlex=false) {
    if (val == true) {
      inputs.hide();
    } else {
      isFlex ? inputs.css({"display": "flex"}) : inputs.show();
    }  
  }

  // Add or remove responsiveness of first from/to column, based on additional from/to columns (aka breaks)
  function toggleResponsive(responsive) {
    if (responsive) {
      $(".first-column").addClass("responsive")  
    } else {
      $(".first-column").removeClass("responsive")  
    }
    
  }

  toggleChecked(timeFormatSetting.prop("checked"), ampmSelectors);
  //toggleChecked(descSetting.prop("checked") == false, descInputs);
  toggleChecked(weekendSetting.prop("checked") == false, weekendInputs, true);

  toggleChecked(breakSetting.prop("checked") == false, breakInputs);
  toggleResponsive(noBreaks);

  timeFormatSetting.on("change", function() {
    toggleChecked($(this).prop("checked"), ampmSelectors);
    isAmPm = timeFormatSetting.prop("checked") == false;
  });

  breakSetting.on("change", function() {
    toggleChecked($(this).prop("checked") == false, breakInputs);
    noBreaks = breakSetting.prop("checked") == false;
    toggleResponsive(noBreaks);
  });

  descSetting.on("change", function() {
    //toggleChecked($(this).prop("checked") == false, descInputs);
  });  

  weekendSetting.on("change", function() {
    toggleChecked($(this).prop("checked") == false, weekendInputs, true);
    noWeekends = weekendSetting.prop("checked") == false;
  });  


  // Show/hide rate, overtime and absence settings based on selected preferences

  var rateSetting = $('select[id="rate"]');
  var rateInputs = $('.rate-hidden');

  var absenceSetting = $('select[id="absence"]');
  var absenceInputs = $('.absence-hidden');

  var overtimeSetting = $('select[id="overtime"]');
  var overtimeInputs = $('.overtime-hidden');

  var advancedSetting = $('select[id="advanced"]');
  var advancedInputs = $('.advanced-hidden');


  function toggleSettings(val, inputs) {
    if (val == "display") {
      inputs.css({"display": "flex"});
    } else {
      inputs.hide();
    }
  }

  toggleSettings(rateSetting[0].value, rateInputs);
  toggleSettings(absenceSetting[0].value, absenceInputs);
  toggleSettings(overtimeSetting[0].value, overtimeInputs);
  toggleSettings(advancedSetting[0].value, advancedInputs);

  rateSetting.on("change", function() {
    toggleSettings(this.value, rateInputs);
  });

  absenceSetting.on("change", function() {
    toggleSettings(this.value, absenceInputs);
  });

  overtimeSetting.on("change", function() {
    toggleSettings(this.value, overtimeInputs);
  });

  advancedSetting.on("change", function() {
    toggleSettings(this.value, advancedInputs);
  });

  // Set rate & overtime via URL

  function setRateViaURL(setting, urlVal, settingSelect) {
    if (typeof(urlVal) === "string") {
      setting.val(urlVal);
      settingSelect.val("display").change();
    }
  }

  setRateViaURL($('#pay input[name="hourly-rate"]'), searchParams.get("hourly_rate"), rateSetting);
  setRateViaURL($('#pay input[name="currency"]'), searchParams.get("currency"), rateSetting);
  setRateViaURL($('#overtime input[name="after-hours"]'), searchParams.get("overtime_hours"), overtimeSetting);
  setRateViaURL($('#overtime input[name="multiply"]'), searchParams.get("overtime_rate"), overtimeSetting);
  setRateViaURL($('#overtime input[name="overtime-setting"]'), searchParams.get("overtime_setting"), overtimeSetting);
  setRateViaURL($('input[name="submit-url"]'), searchParams.get("submit_url"), advancedSetting);

  if (searchParams.get("submit_url")) {
    $('input[name="submit-url"]').prop("disabled", true);
  }

  // Init Datepicker

  var startWeek = dayjs().day(1);
  var endWeek = dayjs().day(7);
  var selectedStartWeek = startWeek;

  $('input[name="dates"]').daterangepicker({
    "maxSpan": {"days": 6},
    "startDate": startWeek.toDate(),
    "endDate": endWeek.toDate(),
    "autoApply": true, 
    "locale": {
      "firstDay": 1
    }
  });

  $('input[name="dates"]').on('apply.daterangepicker', function(ev, picker) {
    // When date range is selected, change selectedStartWeek variable.
    selectedStartWeek = picker.startDate._d;
  });

  // Calculate totals
  // [DONE] 1. Set calendar days first day of the week --> last day of the week
  // 2. Set from/to values as dateTimes, include Ampm input. Calculate duration from them.
  // 3. Add duration to total columns
  // 4. Multiply with pay rate
  // 5. Calculate overtime: how many hours each day (week?) x new pay rate.
  // 6. Sum up all totals

  function addTimeToDate(date, time, ampm) {
    // If no time is provided, return null.
    if (time === undefined || time === "") {
      return null;
    } 

    // If only hour digit is provided, take care of the minute digits.
    if (time.indexOf(":") === -1) {
      time += ":00";
    }

    // Add am or pm to the string.
    var ampmFormat = ""
    if (isAmPm === true) {
      time = time + " " + ampm;
      ampmFormat = " a";
    }
  
    // Parse the date+time from entered hours.
    var totalDate = dayjs((date.format("YYYY-MM-DD") + " " + time), "YYYY-MM-DD h:mm" + ampmFormat);

    // Handle time validation
    if (Object.is(totalDate.date(), NaN)) {
      return null;
    }

    return totalDate;
  }

  function calculatePay(duration, rate, multiply=1) {
    return Math.round(duration.asHours() * rate * multiply * 100) / 100; // round to 2 decimal places
  }

  function parseDuration(time) {
    var timeSplitted = time.split(":");
    return dayjs.duration({h: (timeSplitted[0] || 0), m: (timeSplitted[1] || 0)})
  }

  function getTotalHours(duration) {
    var h = Math.floor(duration.asHours());
    var m = Math.floor(duration.asMinutes()%60);

    if (m<10) { m = "0"+m }

    return h + ":" + m
  }

  function calculateTotals() {
    window.data = {"totalHours": dayjs.duration(0), "totalPay": 0.00, "regularHours": dayjs.duration(0), "regularPay": 0.00, "absence": {}}
    data.title = $('#title').val()
    data.dates = $('input[name="dates"]').val()

    data.hourlyRate = parseFloat($('#pay input[name="hourly-rate"]').val()) || 0.00;
    data.currency = $('#pay input[name="currency"]').val() || "$";

    // Get overtime settings
    if ($('#overtime select[name="overtime"]').val() === "display") {
      data.overtime = {"overtimeHours" : dayjs.duration(0), "overtimePay": 0.00}
      data.overtime.afterHours = parseDuration($('#overtime input[name="after-hours"]').val());
      data.overtime.setting = $('#overtime select[name="overtime-setting"]').val();
      data.overtime.multiply = parseFloat($('#overtime input[name="rate-multiply"]').val());
    }

    for (var i = 0; i < 7; i++) {
      // Set the correct date for each day of the week.
      var date = dayjs(selectedStartWeek).add(i, "day");

      var day = weekDays[i];
      data[day] = {};
      data[day][0] = {};
      data[day][1] = {};

      // Save the from/to hours as the Date object.
      data[day][0]["from"] = addTimeToDate(date, $("#"+day+" .first-column input[name='from']").val(), $("#"+day+" .first-column select[name='from-ampm']").val());
      data[day][0]["to"] = addTimeToDate(date, $("#"+day+" .first-column input[name='to']").val(), $("#"+day+" .first-column select[name='to-ampm']").val());
      data[day][1]["from"] = addTimeToDate(date, $("#"+day+" .second-column input[name='from']").val(), $("#"+day+" .second-column select[name='from-ampm']").val());
      data[day][1]["to"] = addTimeToDate(date, $("#"+day+" .second-column input[name='to']").val(), $("#"+day+" .second-column select[name='to-ampm']").val());
      
      // Calculate the duration for the day & add to subtotal
      data[day]["total"] = dayjs.duration(0);
      if (data[day][0]["from"] != null && data[day][0]["to"] != null) {
        data[day]["total"] = dayjs.duration(-data[day][0]["from"].diff(data[day][0]["to"]));
      }

      if (data[day][1]["from"] != null && data[day][1]["to"] != null) {
        data[day]["total"] = data[day]["total"].add({m: dayjs.duration(-data[day][1]["from"].diff(data[day][1]["to"])).asMinutes()});
      }

      if (data[day]["total"] != 0) {
        $("#"+day+" .total-column span").html("<span class='text-dark'>" + data[day]["total"].format("H:mm") + "</span>");
        var totalDayHours = data[day]["total"];
        
        // Calculate daily overtime
        if (data.hasOwnProperty("overtime") && data.overtime.setting === "day" && data.overtime.afterHours.asMinutes() > 0) {
          var diff = totalDayHours.subtract(data.overtime.afterHours);
          console.log(diff.asHours());
          if (diff.asMinutes() > 0) {
            // In case of overtime for the given day, calculate properly.
            totalDayHours = totalDayHours.subtract(diff);

            data.overtime.overtimeHours = data.overtime.overtimeHours.add(diff);
            data.overtime.overtimePay += calculatePay(diff, data.hourlyRate, data.overtime.multiply);
          }
        }

        data.regularHours = data.regularHours.add(totalDayHours);
        data.regularPay += calculatePay(totalDayHours, data.hourlyRate);
      }

    }

    // Calculate weekly overtime
    if (data.hasOwnProperty("overtime") && data.overtime.setting === "week" && data.overtime.afterHours.asMinutes() > 0) {
      var totalWeekHours = data.regularHours;

      var diff = totalWeekHours.subtract(data.overtime.afterHours);
      if (diff.asMinutes() > 0) {
        // In case of overtime, calculate properly.
        totalWeekHours = totalWeekHours.subtract(diff);

        data.overtime.overtimeHours = data.overtime.overtimeHours.add(diff);
        data.overtime.overtimePay = calculatePay(diff, data.hourlyRate, data.overtime.multiply);
      } 

      data.regularHours = totalWeekHours;
      data.regularPay = calculatePay(totalWeekHours, data.hourlyRate);
    }

    // Calculate absence hours
    if ($('#absence select[name="absence"]').val() === "display") {
      data.absence.hours = parseDuration($('#absence input[name="absence-hours"]').val());
      data.absence.description = $('#absence input[name="description"]').val() || "";
      data.absence.paid = $('#absence input[name="paid-absence"]').prop('checked');
      if (data.absence.paid == true) {
        data.regularPay += calculatePay(data.absence.hours, data.hourlyRate);
      }
      data.regularHours = data.regularHours.add({m: data.absence.hours.asMinutes()});
    }

    if (data.hasOwnProperty("overtime")) {
      data.totalPay = data.regularPay + data.overtime.overtimePay;
      data.totalHours = data.regularHours.add(data.overtime.overtimeHours);
      
      $("#overtime-pay h6").html("<h6>Regular pay: " + data.currency + data.regularPay + "<br>Overtime pay: " + data.currency + data.overtime.overtimePay +  "</h6>");
      $("#overtime-hours h6").html("<h6>Regular hours: " + getTotalHours(data.regularHours) + "<br>Overtime hours: " + getTotalHours(data.overtime.overtimeHours) +  "</h6>");

    } else {
      data.totalPay = data.regularPay;
      data.totalHours = data.regularHours;
    }

    data.totalHours = getTotalHours(data.totalHours);
    $("#total-pay h4").html("Pay: " + data.currency + data.totalPay);
    $("#total-hours h4").html("Hours: " + data.totalHours);

    return data;
  }

  function prepareTimesheetForPrint(data) {
    var timeFormat = "h:mm a"
    if (isAmPm === false) {
      timeFormat = "H:mm"
    }

    var printArray = [[
                    {text: 'DAY', style: 'tableHeader', border: [false, false, false, true]}, 
                    {text: 'FROM', style: 'tableHeader', border: [false, false, false, true]}, 
                    {text: 'TO', style: 'tableHeader', border: [false, false, false, true]}, 
                    {text: noBreaks ? "" : 'FROM', style: 'tableHeader', border: [false, false, false, true]}, 
                    {text: noBreaks ? "" : 'TO', style: 'tableHeader', border: [false, false, false, true]}, 
                    {text: 'TOTAL', style: 'tableHeader', border: [false, false, false, true], alignment: "right"}
                  ]]

    printArray.push(["", "", "", "", "", ""]);

    for (var i=0; i < (noWeekends ? 5 : 7); i++) {
      var weekDay = weekDays[i];
      var dailyPrint = [weekDay.toUpperCase()];

      for (var j=0; j < 2; j++) {
        if (data[weekDay][j]["from"] == null || (j==1 && noBreaks)) {
          dailyPrint = dailyPrint.concat(["", ""]);
        } else {
          dailyPrint = dailyPrint.concat([{ text: data[weekDay][j]["from"].format(timeFormat), style: "timeStamp"}, {text: data[weekDay][j]["to"].format(timeFormat), style: "timeStamp"}]);
        }
      }

      dailyPrint.push({text: data[weekDay]["total"].format("H:mm"), alignment: "right", style: "totals"});
      printArray.push(dailyPrint);
    }

    if (data.absence.hasOwnProperty("hours")) {
      printArray.push(["", "", "", "", "", ""]);
      printArray.push([{text: "ABSENCE"}, "", "", "", "", getTotalHours(data.absence.hours)]);
      printArray.push([{text: data.absence.description, colSpan: 6, style: "description"}])
    }

    printArray.push([
          {
            border: [false, true, false, false],
            fillColor: '#DCEEFA',
            text: '',
            style: "totalFooter"
          },
          {
            border: [false, true, false, false],
            fillColor: '#DCEEFA',
            text: ''
          },
          {
            border: [false, true, false, false],
            fillColor: '#DCEEFA',
            text: ''
          },
          {
            border: [false, true, false, false],
            fillColor: '#DCEEFA',
            text: ''
          },
          {
            border: [false, true, false, false],
            fillColor: '#DCEEFA',
            text: "",
            style: "totalFooter"
          },
          {
            border: [false, true, false, false],
            fillColor: '#DCEEFA',
            text: "",
            style: "totalFooter"
          }
        ])

    printArray.push(
        [
          {
            fillColor: '#DCEEFA',
            text: 'Total',
            style: "totalFooter"
          },
          {
            fillColor: '#DCEEFA',
            text: ''
          },
          {
            fillColor: '#DCEEFA',
            text: ''
          },
          {
            fillColor: '#DCEEFA',
            text: ''
          },
          {
            fillColor: '#DCEEFA',
            bold: true,
            text: data.hourlyRate > 0 ? "Pay: " + data.currency + data.totalPay : "",
            style: "totalFooter"
          },
          {
            fillColor: '#DCEEFA',
            bold: true,
            text: "Hours: " + data.totalHours,
            alignment: "right",
            style: "totalFooter"
          }
        ])

    if (data.hasOwnProperty("overtime")) {
      printArray.push(["", "", "", "", "", ""]);
      printArray.push([
          { text: "Overtime", style: "settings" }, "", "", "", 
          { text: (data.hourlyRate > 0 ? ("Regular pay: " + data.currency + data.regularPay + "\nOvertime pay: " + data.currency + data.overtime.overtimePay) : ""), style: "description"}, 
          { text: "Regular hours: " + getTotalHours(data.regularHours) + "\nOvertime hours: " + getTotalHours(data.overtime.overtimeHours), style: "description", alignment: "right"}
          ]);
    }

    console.log(printArray);

    return printArray;
  }

  function prepareTotalsForPrint(data) {
    var printArray = [];

    if (data.hourlyRate > 0) {
      printArraySettings.push("Hourly rate: " + data.currency + data.hourlyRate + "/hour");
    }

    if (data.hasOwnProperty("overtime")) {
      printArraySettings.push("Overtime: " + data.currency + (data.overtime.multiply * data.hourlyRate) 
                                                        + "/hour after " + data.overtime.afterHours.format("H:mm") 
                                                        + " hours per " + data.overtime.setting);
    }

    return printArraySettings;
  }

  function prepareSettingsForPrint(data) {
    var printArray = [];

    if (data.hourlyRate > 0) {
      printArray.push("Hourly rate: " + data.currency + data.hourlyRate + "/hour");
    }

    if (data.hasOwnProperty("overtime")) {
      printArray.push("Overtime: " + data.currency + (data.overtime.multiply * data.hourlyRate) 
                                                        + "/hour after " + data.overtime.afterHours.format("H:mm") 
                                                        + " hours per " + data.overtime.setting);
    }

    return printArray;
  }

  $('form#main-form').on("submit", function(e) {    
    var data = calculateTotals();
    console.log(data);
    e.preventDefault();
  });

  $('#print').on("click", function(e) { 
    var data = calculateTotals();
    var timesheetPrint = prepareTimesheetForPrint(data);
    var settingsPrint = prepareSettingsForPrint(data);
    var widths = noBreaks ? [ 150, 60, 60, "*", 100, 100] : [ 100, "*", "*", "*", 100, 100]

    var dd = {
      content: [
        { text: data.title, style: "header"}, 
        { text: "Date range: " + data.dates, style: "subheader"},
        { text: settingsPrint[0]||"" , margin: [0, 10, 0, 5], style: "settings"},
        { text: settingsPrint[1]||"", style: "settings" },
        {
          style: 'timesheetTable',
          layout: {defaultBorder: false},

          table: {
            headerRows: 1,
            widths: widths,
            body: timesheetPrint
          }
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 10, 0, 10],
          color: "#3B8FC2"
        },
        subheader: {
          fontSize: 12,
          bold: true,
          color: "#495057"
        },
        settings: {
          fontSize: 12,
          bold: false,
          color: "#6c757d"
        },
        small: {
          fontSize: 8
        },
        timesheetTable: {
          margin: [0, 20, 0, 10], 
          fontSize: 10,
          lineHeight: 1.5,
          bold: false,
          color: '#495057'
        },
        tableHeader: {
          bold: false,
          fontSize: 10,
          color: '#6c757d'
        },
        description: {
          fontSize: 10,
          italics: true,
          color: "#6c757d"
        },
        timeStamp: {
          fontSize: 10
        },
        totals: {
          fontSize: 11,
          bold: true,
          color: "#296487"
        },
        totalFooter: {
          fontSize: 12,
          bold: true,
          lineHeight: 1.2,
          color: "#296487"
        }
      }
    }

    pdfMake.createPdf(dd).open();

    e.preventDefault();
  });

  $("#send").on("click", function(e) {
    var data = calculateTotals();  
    var url = $('input[id="submit-url"]').val();

    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(data),      
        contentType: "application/json; charset=utf-8",
        headers: { 'Access-Control-Allow-Origin': '*' },
        crossDomain: true,
        dataType: "json",
        mode: "cors",
        success: function(msg) {
          console.log("great!");
        },
        error: function(msg) {
          console.log('error');
        }
    });

    // Send email via JS? https://www.mailjet.com/pricing/ (watch for the credentials)

    e.preventDefault();

  });

  $('#clear').on("click", function(e) { 
    $("#timesheet input").val("");
    $("#timesheet select[name='from-ampm']").val("am").change();
    $("#timesheet select[name='to-ampm']").val("pm").change();
    e.preventDefault();
  });

});
