// Create days component
let days = Vue.component('days', {
  props: {
    startingDay: 0,
    startingDate: '',
    daysToCreate: 0,
    eomInvalidDays: 0
  },
  methods: {
    computeDate: function (dayOfMonth, dayIndex) {
      return parseInt(dayOfMonth) + parseInt(dayIndex);
    }, // computeDate
    dayIsHoliday: function (month, day) {
        // Only building in US holidays.
        // Check if country == US, if so, run through holidays
        if ( this.country != 'US' ) {
            return false;
        }

        // Holidays
        let holidayList = [
            'January 1', // New Year's Day
            'July 4', // 4th of July
            'August 22', // My birthday -- might as well be a holiday :)
            'November 11', // Veterans Day
            'December 25' // Christmas Day
        ];

        // If in holidayList, return true, otherwise, false
        return holidayList.indexOf(month + ' ' + day) > -1;
    } // dayIsHoliday
  },
  template: `
      <div class="day-container">
          <div v-for="(n, index) in startingDay" class="single-day invalid"></div>
          <div v-for="(n, index) in daysToCreate" class="single-day" v-text="computeDate(startingDate, index)"></div>
          <div v-for="(n, index) in eomInvalidDays" class="single-day invalid"></div>
      </div>
  `
});

// Create calendar component
let calendar = Vue.component('calendars', {
  props: {
    date: String,
    months: Array
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
        <days v-bind:startingDay="month.startingDay" v-bind:startingDate="month.startingDate" v-bind:daysToCreate="month.daysToCreate" v-bind:eomInvalidDays="month.eomInvalidDays"></days>
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
        days: 22,
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

      // Create the first month (automatic after that)
      this.createMonth(
        this.form.date,
        moment(this.form.date).format('D'),
        moment(this.form.date).day(),
      );

      return this.allMonths;
    } // months
  },
  methods: {
    checkDateFormat: function () {
      this.form.dateNotValid = !moment(this.form.date).isValid();
    }, // checkDateFormat
    checkCountryCode: function () {
        if ( /^[a-zA-Z]{2}$/gm.exec( this.form.country ) !== null ) {
            this.form.countryNotValid = false;
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
    } // getNextMonth
  } // methods
});