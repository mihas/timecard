// Example starter JavaScript for disabling form submissions if there are invalid fields
$(function () {
  'use strict'

  dayjs.extend(window.dayjs_plugin_customParseFormat);
  dayjs.extend(window.dayjs_plugin_duration);
  var weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  // Set options based on pre-selected settings

  var timeFormatSetting = $('input[id="time-format"]');
  var ampmSelectors = $('.ampm-select');

  var descSetting = $('input[id="description-setting"]');
  var descInputs = $('.description-hidden');

  var breakSetting = $('input[id="break-setting"]');
  var breakInputs = $('.second-column');

  var weekendSetting = $('input[id="weekend-setting"]');
  var weekendInputs = $('.weekend-hidden');

  
  // Set options based on URL parameters
  var searchParams = new URLSearchParams(window.location.search)

  function setSettingsViaURL(setting, urlVal) {
    if (urlVal === true) {
      setting.prop("checked", urlVal);
    }
  }

  setSettingsViaURL(timeFormatSetting, searchParams.get("24h_format") === "true");
  setSettingsViaURL(breakSetting, searchParams.get("add_breaks") === "true");
  setSettingsViaURL(weekendSetting, searchParams.get("show_weekend") === "true");
  

  // Disable changing an input that is set via URL
  var lockSettings = searchParams.get("lock_settings") === "true"
  if (lockSettings) {
    $(".lockable-input").prop("disabled", lockSettings);
  }

  // Prepare variables for default options
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
  toggleChecked(weekendSetting.prop("checked") == false, weekendInputs, true);
  toggleChecked(breakSetting.prop("checked") == false, breakInputs);
  toggleResponsive(noBreaks);
  //toggleChecked(descSetting.prop("checked") == false, descInputs);

  timeFormatSetting.on("change", function() {
    toggleChecked($(this).prop("checked"), ampmSelectors);
    isAmPm = timeFormatSetting.prop("checked") == false;
  });

  breakSetting.on("change", function() {
    toggleChecked($(this).prop("checked") == false, breakInputs);
    noBreaks = breakSetting.prop("checked") == false;
    toggleResponsive(noBreaks);
  });

  weekendSetting.on("change", function() {
    toggleChecked($(this).prop("checked") == false, weekendInputs, true);
    noWeekends = weekendSetting.prop("checked") == false;
  }); 

  /*
  descSetting.on("change", function() {
    toggleChecked($(this).prop("checked") == false, descInputs);
  });  
  */ 

  // Show/hide rate, overtime and absence settings based on selected preferences

  var rateSetting = $('select[id="rate"]');
  var rateInputs = $('.rate-hidden');

  var absenceSetting = $('select[id="absence"]');
  var absenceInputs = $('.absence-hidden');

  var overtimeSetting = $('select[id="overtime"]');
  var overtimeInputs = $('.overtime-hidden');

  //var advancedSetting = $('select[id="advanced"]');
  //var advancedInputs = $('.advanced-hidden');

  // Set rate & overtime via URL
  function setValueViaURL(setting, urlVal, settingSelect=null) {
    if (typeof(urlVal) === "string") {
      setting.val(urlVal);
      if (settingSelect != null) {
        settingSelect.val("display").change();
      }
    }
  }

  setValueViaURL($('#pay input[name="hourly-rate"]'), searchParams.get("hourly_rate"), rateSetting);
  setValueViaURL($('#pay input[name="currency"]'), searchParams.get("currency"), rateSetting);
  setValueViaURL($('#overtime input[name="after-hours"]'), searchParams.get("overtime_hours"), overtimeSetting);
  setValueViaURL($('#overtime input[name="multiply"]'), searchParams.get("overtime_rate"), overtimeSetting);
  setValueViaURL($('#overtime select[name="overtime-setting"]'), searchParams.get("overtime_setting"), overtimeSetting);
  setValueViaURL($('input[name="urlAddress"]'), searchParams.get("submit_url"));

  if (searchParams.get("submit_url")) {
    $('input[id="urlAddress"]').prop("disabled", true);
  }

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
  //toggleSettings(advancedSetting[0].value, advancedInputs);

  rateSetting.on("change", function() {
    toggleSettings(this.value, rateInputs);
  });

  absenceSetting.on("change", function() {
    toggleSettings(this.value, absenceInputs);
  });

  overtimeSetting.on("change", function() {
    toggleSettings(this.value, overtimeInputs);
  });

  /* advancedSetting.on("change", function() {
    toggleSettings(this.value, advancedInputs);
  });
  */



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

  // -- Calculate totals --

  // Params: date (date obj), time (string), ampm (string).
  // Return: date object with the correct timestamp
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

  // Params: duration string; Return: dayjs duration object
  function parseDuration(time) {
    var timeSplitted = time.split(":");
    return dayjs.duration({h: (timeSplitted[0] || 0), m: (timeSplitted[1] || 0)})
  }

  // Params: dayjs duration obj; Return: time string in HH:mm format
  function getTotalHours(duration) {
    var h = Math.floor(duration.asHours());
    var m = Math.floor(duration.asMinutes()%60);

    if (m<10) { m = "0"+m }

    return h + ":" + m
  }

  function calculateTotals() {
    window.data = {
      "title": $('#title').val(),
      "dates": $('input[name="dates"]').val(),
      "totalHours": dayjs.duration(0), 
      "totalPay": 0.00, 
      "regularHours": dayjs.duration(0), 
      "regularPay": 0.00, 
      "absence": {}
    }

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
      data[day]["date"] = date.format("YYYY-MM-DD");
      
      // Calculate the duration for the day & add to subtotal
      data[day]["total"] = dayjs.duration(0);
      if (data[day][0]["from"] != null && data[day][0]["to"] != null) {
        data[day]["total"] = dayjs.duration(-data[day][0]["from"].diff(data[day][0]["to"]));
      }

      if (data[day][1]["from"] != null && data[day][1]["to"] != null) {
        data[day]["total"] = data[day]["total"].add({m: dayjs.duration(-data[day][1]["from"].diff(data[day][1]["to"])).asMinutes()});
      }

      if (data[day]["total"].asMinutes() > 0) {
        $("#"+day+" .total-column span").html("<span class='text-dark'>" + data[day]["total"].format("H:mm") + "</span>");
        var totalDayHours = data[day]["total"];
        data[day]["totalMinutes"] = data[day]["total"].asMinutes();
        data[day]["total"] = data[day]["total"].format("H:mm");
        
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
      } else {
        data[day]["total"] = "0:00"
        data[day]["totalMinutes"] = 0;
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

    // Final calculation of totals based on overtime or without
    if (data.hasOwnProperty("overtime")) {
      data.totalPay = data.regularPay + data.overtime.overtimePay;
      data.totalHours = data.regularHours.add(data.overtime.overtimeHours);
      data.totalMinutes = data.totalHours.asMinutes();
      data.totalHours = getTotalHours(data.totalHours);
      data.regularHours = getTotalHours(data.regularHours);
      data.overtime.overtimeHours = getTotalHours(data.overtime.overtimeHours);
      
      $("#overtime-pay h6").html("<h6>Regular pay: " + data.currency + data.regularPay + "<br>Overtime pay: " + data.currency + data.overtime.overtimePay +  "</h6>");
      $("#overtime-hours h6").html("<h6>Regular hours: " + data.regularHours + "<br>Overtime hours: " + data.overtime.overtimeHours +  "</h6>");

    } else {
      data["totalMinutes"] = data.regularHours.asMinutes();
      data.regularHours = getTotalHours(data.regularHours);

      data.totalPay = data.regularPay;
      data.totalHours = data.regularHours;
    }

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

      dailyPrint.push({text: data[weekDay]["total"], alignment: "right", style: "totals"});
      printArray.push(dailyPrint);
    }

    if (data.absence.hasOwnProperty("hours")) {
      printArray.push(["", "", "", "", "", ""]);
      printArray.push(["ABSENCE", "", "", "", "", {text: getTotalHours(data.absence.hours), alignment: "right", style: "totals"}]);
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
          { text: "Regular hours: " + data.regularHours + "\nOvertime hours: " + data.overtime.overtimeHours, style: "description", alignment: "right"}
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

  function setPdfContent(data) {
    
    var timesheetPrint = prepareTimesheetForPrint(data);
    var settingsPrint = prepareSettingsForPrint(data);
    var widths = noBreaks ? [ 150, 60, 60, "*", 100, 100] : [ 100, "*", "*", "*", 100, 100]

    return {
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
        },
        { text: "Made with My Hours time card", link: "https://myhours.com/timesheet-time-tracking", style: "backlink"}
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
        },
        backlink: {
          fontSize: 9,
          margin: [0, 50, 0, 10],
          color: "#3B8FC2",
          alignment: "right"
        }
      }
    }
  }


  $('#print').on("click", function(e) { 
    var pdfData = setPdfContent(calculateTotals());

    pdfMake.createPdf(pdfData).download("timecard_"+dayjs().format("YYYY-MM-DD"));

    e.preventDefault();
  });

  $("#send, #sendUrl").on("click", function(e) {
    var url = $('input[id="urlAddress"]').val();
    if (url === undefined || url === "") {
      url = "https://en25dnd8wsnvvmk.m.pipedream.net";
    }
    var data = calculateTotals();  
    var pdfData = setPdfContent(data);
    data.emailAddress = $("#emailAddress").val();

    console.log(data);

    pdfMake.createPdf(pdfData).getBase64((dd) => {
      data.pdf64 = dd;
      grecaptcha.ready(function() {
        grecaptcha.execute('6LfbFrUaAAAAAGqSxMut1SIWSBgDGWT1Pl2BtvFE', {action: 'submit'}).then(function(token) {
          data.recaptToken = token;
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
              console.log("sent!");
              $(".successNote").attr('style', 'display: block !important');
            },
            error: function(msg) {
              console.log('error');
              $(".errorNote").attr('style', 'display: block !important');
            }
          });
        });
      });
    });    

    e.preventDefault();

  });


  $('#calculate').on("click", function(e) {    
    var data = calculateTotals();
    console.log(data);
    e.preventDefault();
  });

  $('#clear').on("click", function(e) { 
    $("#timesheet input").val("");
    $("#timesheet select[name='from-ampm']").val("am").change();
    $("#timesheet select[name='to-ampm']").val("pm").change();
    e.preventDefault();
  });

});
