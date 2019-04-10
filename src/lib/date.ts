import moment from "moment"

// TODO: ADD timezone to end of strings with hours

const formattedOpeningHoursDate = date => {
  const momentToUse = moment.utc(date)
  const momentDate = momentToUse.format("MMM D")
  const momentHour = momentToUse.format("ha")
  if (momentHour && momentDate && momentToUse.minutes() !== 0) {
    const momentHourWithMinutes = momentToUse.format("h:mma")
    return `${momentDate} at ${momentHourWithMinutes}`
  } else if (momentHour && momentDate) {
    return `${momentDate} at ${momentHour}`
  } else if (momentDate) {
    return momentDate
  }
}

/**
 * If within same am/pm:   9:00 – 11:30pm
 * If within across both am/pm:   9:00am – 12:30pm EST
 */
export function formattedHours(startAt, endAt) {
  const startMoment = moment.utc(startAt)
  const endMoment = moment.utc(endAt)
  let startHour
  let endHour = endMoment.format("h:mma")
  if (
    (startMoment.hours() <= 12 && endMoment.hours() <= 12) ||
    (startMoment.hours() >= 12 && endMoment.hours() >= 12)
  ) {
    startHour = startMoment.format("h:mm")
  } else {
    startHour = startMoment.format("h:mma")
  }

  return `${startHour} – ${endHour}`
}

/**
 * Returns true if dates are on same day
 */
export function datesAreSameDay(startAt, endAt) {
  const startMoment = moment.utc(startAt)
  const endMoment = moment.utc(endAt)
  if (
    startMoment.dayOfYear() === endMoment.dayOfYear() &&
    startMoment.year() === endMoment.year()
  ) {
    return true
  } else {
    return false
  }
}

/**
 * Opens Mar 29 at 4:00pm
 * Closes Apr 3 at 12:30pm
 * Closed
 */
export function formattedOpeningHours(startAt, endAt) {
  const thisMoment = moment()
  const startMoment = moment.utc(startAt)
  const endMoment = moment.utc(endAt)
  if (thisMoment.isBefore(startMoment)) {
    return `Opens ${formattedOpeningHoursDate(startAt)}`
  } else if (thisMoment.isBefore(endMoment)) {
    return `Closes ${formattedOpeningHoursDate(endAt)}`
  } else {
    return "Closed"
  }
}

/**
 * 5:00pm
 * 5:30pm
 * TODO: Use 24h clock if not Canada (except Québec), Australia, New Zealand, the Philippines, United States.
 */
export function singleHour(date) {
  return moment.utc(date).format("h:mma")
}

/**
 * Aug 5 at 5:00pm
 * Aug 5, 2022 at 5:00pm
 */
export function singleDate(date) {
  const now = moment()
  const thisMoment = moment.utc(date)
  if (now.year() !== thisMoment.year()) {
    return `${thisMoment.format("MMM D, YYYY")} at ${singleHour(thisMoment)}`
  } else {
    return `${thisMoment.format("MMM D")} at ${singleHour(thisMoment)}`
  }
}

/**
 * Wed, Apr 24
 * if not this year:   Wed, April 24, 2022
 */
export function singleDateWithoutHour(date) {
  const thisMoment = moment(date)
  const now = moment()
  if (now.year() === thisMoment.year()) {
    return `${thisMoment.format("ddd")}, ${thisMoment.format("MMM D")}`
  } else {
    return `${thisMoment.format("ddd")}, ${thisMoment.format("MMM D, YYYY")}`
  }
}

/**
 * Dec 5 from 8:00pm – 9:00pm
 * Dec 5, 2022 from 8:00pm – 9:00pm
 * Dec 5 at 8:00pm – Dec 30 at 5:00pm
 * Dec 5, 2018 at 8:00pm – Jan 5, 2019 at 5:00pm
 */
export function datesWithHours(startAt, endAt) {
  const now = moment()
  const startMoment = moment.utc(startAt)
  const endMoment = moment.utc(endAt)
  const hourFormat = "h:mma"
  let monthFormat = "MMM D"
  if (
    startMoment.year() !== endMoment.year() ||
    now.year() !== startMoment.year()
  ) {
    // Adds years if the dates are not the same year
    monthFormat = monthFormat.concat(", YYYY")
  }

  if (datesAreSameDay(startAt, endAt)) {
    return `${startMoment.format(monthFormat)} from ${formattedHours(
      startAt,
      endAt
    )}`
  } else {
    return `${startMoment.format(monthFormat)} at ${startMoment.format(
      hourFormat
    )} – ${endMoment.format(monthFormat)} at ${endMoment.format(hourFormat)}`
  }
}

/**
 * Thu, Nov 15 from 6:00pm – 9:30pm
 * Thu, Nov 15, 2022 from 6:00pm – 9:30pm
 * Thu, Nov 15 at 6:00pm – Thu, Oct 18 at 6:30pm
 * Sun, Dec 5, 2022 at 8:00pm – Sun, Dec 30, 2022 at 5:00pm EST
 */
export function datesWithDaysAndHours(startAt, endAt) {
  const now = moment()
  const startMoment = moment.utc(startAt)
  const endMoment = moment.utc(endAt)
  const dayFormat = "ddd"
  const hourFormat = "h:mma"
  let monthFormat = "MMM D"

  if (
    startMoment.year() !== endMoment.year() ||
    now.year() !== startMoment.year()
  ) {
    // Adds years if the dates are not the same year or not this year
    monthFormat = monthFormat.concat(", YYYY")
  }

  if (datesAreSameDay(startAt, endAt)) {
    return `${startMoment.format(dayFormat)}, ${startMoment.format(
      monthFormat
    )} from ${formattedHours(startAt, endAt)}`
  } else {
    return `${startMoment.format(dayFormat)}, ${startMoment.format(
      monthFormat
    )} at ${startMoment.format(hourFormat)} – ${endMoment.format(
      dayFormat
    )}, ${endMoment.format(monthFormat)} at ${endMoment.format(hourFormat)}`
  }
}

/**
 * A formated date range without hours
 * Nov 1 – 4, 2018
 * Nov 1, 2018 – Jan 4, 2019
 */
export function dateRange(startAt, endAt) {
  const startMoment = moment.utc(startAt)
  const endMoment = moment.utc(endAt)
  const thisMoment = moment()
  let startFormat = "MMM D"
  let endFormat = "D"
  let singleDateFormat = "MMM D"

  if (startMoment.year() !== endMoment.year()) {
    // Adds years if the dates are not the same year
    startFormat = startFormat.concat(", YYYY")
    endFormat = endFormat.concat(", YYYY")
  } else if (endMoment.year() !== thisMoment.year()) {
    // Otherwise if they're the same year, but not this year, add year to endFormat
    endFormat = endFormat.concat(", YYYY")
  }

  if (
    startMoment.month() !== endMoment.month() ||
    startMoment.year() !== endMoment.year()
  ) {
    // Show the end month if the month is different
    endFormat = "MMM ".concat(endFormat)
  }

  if (
    startMoment.dayOfYear() === endMoment.dayOfYear() &&
    startMoment.year() === endMoment.year()
  ) {
    // Duration is the same day
    if (endMoment.year() !== thisMoment.year()) {
      singleDateFormat = singleDateFormat.concat(", YYYY")
    }
    return endMoment.format(singleDateFormat)
  } else {
    // Show date range if not the same day
    return `${startMoment.format(startFormat)} – ${endMoment.format(endFormat)}`
  }
}

function relativeDays(prefix, today, other, max) {
  const delta = other.diff(today, "days")
  if (delta >= 0) {
    if (delta === 0) {
      return `${prefix} today`
    } else if (delta === 1) {
      return `${prefix} tomorrow`
    } else if (delta <= max) {
      return `${prefix} in ${delta} days`
    }
  }
  return null
}

/**
 * Opening today
 * Closing tomorrow
 * Opening in 5 days
 */
export function exhibitionStatus(startAt, endAt, max = 5) {
  const today = moment().startOf("day")
  return (
    relativeDays("Opening", today, moment(startAt).startOf("day"), max) ||
    relativeDays("Closing", today, moment(endAt).startOf("day"), max)
  )
}
