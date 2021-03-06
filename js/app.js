// Create days component
let days = Vue.component('days', {
  props: {
    currentMonth: String,
    startingDay: Number,
    startingDate: String,
    daysToCreate: Number,
    eomInvalidDays: Number
  },
  computed:  {
    country: function () {
      return this.$root.form.country;
    }
  },
  methods: {
    computeDate: function (dayOfMonth, dayIndex) {
      return parseInt(dayOfMonth) + parseInt(dayIndex);
    }, // computeDate
    isHoliday: function (month, day) {
        // Only building in US holidays.
        // Check if country == US, if so, run through holidays
        if ( this.country != 'US' ) {
            return false;
        }

        // Set Valid US Holidays
        let holidayList = [
            'January 1', // New Year's Day
            'July 4', // 4th of July
            'August 22', // My birthday -- might as well be a holiday :)
            'November 11', // Veterans Day
            'December 24', // Christmas Eve
            'December 25' // Christmas Day
        ];

        // If day is in holidayList, return true, otherwise, false
        return holidayList.indexOf(month + ' ' + day) > -1;
    } // dayIsHoliday
  },
  template: `
      <div class="day-container">
          <div v-for="(n, index) in startingDay" class="single-day invalid"></div>
          <div v-for="(n, index) in daysToCreate" class="single-day" :class="{ holiday: isHoliday(currentMonth, computeDate(startingDate, index)) }" v-text="computeDate(startingDate, index)"></div>
          <div v-for="(n, index) in eomInvalidDays" class="single-day invalid"></div>
      </div>
  `
});

// Create calendar component
let calendar = Vue.component('calendars', {
  props: {
    date: String,
    months: Array,
    country: String
  },
  template: `
  <div class="calendar-container cf">
    <div v-for="(month, key) in months" :key="key" class="calendar">
      <div class="calendar-inner">
        <div class="month-header">{{ month.name }}</div>
        <div class="days-of-week">
          <div>S</div>
          <div>M</div>
          <div>T</div>
          <div>W</div>
          <div>T</div>
          <div>F</div>
          <div>S</div>
        </div>
        <days v-bind:currentMonth="month.name" v-bind:country="country" v-bind:startingDay="month.startingDay" v-bind:startingDate="month.startingDate" v-bind:daysToCreate="month.daysToCreate" v-bind:eomInvalidDays="month.eomInvalidDays"></days>
      </div>
    </div>
  </div>
  `
});

let app = new Vue({
  el: '#app',
  data: {
    form: {
        date: moment().format('YYYY-MM-DD'),
        dateNotValid: false,
        days: 10,
        country: 'US',
        countryNotValid: false
    },
    daysToShowRemaining: Number,
    nextMonth: String,
    allMonths: []
  }, // data
  components: {
    calendar: calendar,
    days: days
  },
  computed: {
    months: function () {
      this.allMonths = [];
      this.daysToShowRemaining = this.form.days;

      // Create the first month (recursive after that)
      this.createMonth(
        this.form.date,
        moment(this.form.date).format('D'),
        moment(this.form.date).day()
      );
      // Return array of months
      return this.allMonths;
    } // months
  },
  methods: {
    checkDateFormat: function () {
      this.form.dateNotValid = !moment(this.form.date).isValid();
      // If valid date, track event
      if ( this.form.dateNotValid === true ) {
        this.trackEvent('change', 'form_date', 'user_changed_date_' + moment(this.form.date).format(YYYY_MM_DD));
      }
    }, // checkDateFormat
    checkCountryCode: function () {
        // Make uppercase
        this.form.country = this.form.country.toString();
        this.form.country = this.form.country.toUpperCase();
        if ( /^[A-Z]{2}$/gm.exec( this.form.country ) !== null ) {
            this.form.countryNotValid = false;
            this.trackEvent('change', 'form_country', 'user_changed_country_' + this.form.country);
        } else {
            this.form.countryNotValid = true;
        }
    }, // checkCountryCode
    createMonth: function (date, monthStartingDate, monthStartingDay) {
      let newMonth = [];

      // Set current month name
      newMonth.name = moment(date).format('MMMM');
      // Set starting day of month
      newMonth.startingDate = monthStartingDate;
      // Set starting day of week
      newMonth.startingDay = monthStartingDay;

      // If starting month can display all days requested
      if ( this.daysToShowRemaining <= this.getDaysLeftInMonth(date) ) {
        // Set days to create
        newMonth.daysToCreate = this.daysToShowRemaining;
        // Determine number of invalid days to add to end of month (abs for non-negative)
        newMonth.eomInvalidDays = ( 7 - moment(date).add(newMonth.daysToCreate, 'd').day() );
        if ( newMonth.eomInvalidDays == 7 ) {
          newMonth.eomInvalidDays = 0;
        }

        // Subtract from global count
        this.daysToShowRemaining = 0;
        // Add to months array
        this.allMonths.push(newMonth);
        return;
      } else {
        // Show all the days you can
        newMonth.daysToCreate = this.getDaysLeftInMonth(date);
        // Determine number of invalid days to add to end of month (abs for non-negative)
        newMonth.eomInvalidDays = ( 7 - moment(date).add(newMonth.daysToCreate, 'd').day() );
        if ( newMonth.eomInvalidDays == 7 ) {
          newMonth.eomInvalidDays = 0;
        }
        // Subtract from global count
        this.daysToShowRemaining = this.daysToShowRemaining - newMonth.daysToCreate;
        // Add to months array
        this.allMonths.push(newMonth);

        // Need additional months
        this.nextMonth = moment(this.getNextMonth(date)).format('YYYY-MM-DD');
        // Create new month, making sure to start on first day, and pass day of week
        this.createMonth(this.nextMonth, '1', moment(this.nextMonth).day());
        return;
      }
    }, // createMonth
    getDaysLeftInMonth: function (date) {
      let endOfMonth = moment(date).endOf('month');
      let today = moment(date);
      return endOfMonth.diff(today, 'days') + 1;
    }, // getDaysLeftInMonth
    getNextMonth: function (currentDate) {
      let theNextMonth = moment(currentDate).add(1, 'M').format('YYYY-MM');
      return theNextMonth;
    }, // getNextMonth
    trackEvent: function (action, category, label, value, callback) {

      if( typeof gtag == 'function' ) {

        var event_action    = action || null,
            event_category  = category || null,
            event_label     = label || null,
            event_value     = value || null,
            event_callback  = callback || function(){};

        if (event_action === null) { return; } // action is required

        // Send GA Event
        gtag('event', event_action, {
          'event_category': event_category,
          'event_action':   event_action,
          'event_label':    event_label,
          'value':          event_value,
          'event_callback': event_callback
        });
      } // end if gtag
    } // trackEvent
  } // methods
});