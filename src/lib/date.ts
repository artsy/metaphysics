import moment from "moment-timezone"

export const DEFAULT_TZ = "UTC"

/**
 * Returns true if dates are on same day, timezone must be the same for both timestamps
 */
export function datesAreSameDay(startAt, endAt, timezone) {
  const startMoment = moment.tz(startAt, timezone)
  const endMoment = moment.tz(endAt, timezone)
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
 * 5:00pm
 * 5:30pm
 * TODO: Use 24h clock if not Canada (except Québec), Australia, New Zealand, the Philippines, United States.
 */
export function singleTime(date, timezone) {
  return moment.tz(date, timezone).format("h:mma z")
}

/**
 * If within same am/pm:   9:00 – 11:30pm
 * If within across both am/pm:   9:00am – 12:30pm EST
 */
export function timeRange(startAt, endAt, timezone) {
  const startMoment = moment.tz(startAt, timezone)
  const endMoment = moment.tz(endAt, timezone)
  let startHour
  const endHour = endMoment.format("h:mma z")
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
 * Aug 5 at 5:00pm
 * Aug 5, 2022 at 5:00pm
 */
export function singleDateTime(date, timezone) {
  const now = moment.tz(moment(), timezone)
  const thisMoment = moment.tz(date, timezone)
  if (now.year() !== thisMoment.year()) {
    return `${thisMoment.format("MMM D, YYYY")} at ${thisMoment.format(
      "h:mma z"
    )}`
  } else {
    return `${thisMoment.format("MMM D")} at ${thisMoment.format("h:mma z")}`
  }
}

/**
 * Apr 24
 * if not this year:  April 24, 2022
 */
export function singleDate(date, timezone) {
  const thisMoment = moment.tz(date, timezone)
  const now = moment()
  if (now.year() !== thisMoment.year()) {
    return `${thisMoment.format("MMM D, YYYY")}`
  } else {
    return `${thisMoment.format("MMM D")}`
  }
}

/**
 * Wed, Apr 24
 * if not this year:   Wed, April 24, 2022
 */
export function singleDateWithDay(date, timezone) {
  const thisMoment = moment.tz(date, timezone)
  const now = moment()
  if (now.year() !== thisMoment.year()) {
    return `${thisMoment.format("ddd")}, ${thisMoment.format("MMM D, YYYY")}`
  } else {
    return `${thisMoment.format("ddd")}, ${thisMoment.format("MMM D")}`
  }
}

/**
 * Dec 5 at 8:00pm – 9:00pm
 * Dec 5, 2022 at 8:00pm – 9:00pm
 * Dec 5 at 8:00pm – Dec 30 at 5:00pm
 * Dec 5, 2018 at 8:00pm – Jan 5, 2019 at 5:00pm
 * Thu, Nov 15 at 6:00pm – 9:30pm
 * Thu, Nov 15, 2022 at 6:00pm – 9:30pm
 * Thu, Nov 15 at 6:00pm – Thu, Oct 18 at 6:30pm
 * Dec 5, 2022 at 8:00pm – Dec 30, 2022 at 5:00pm EST
 */
export function dateTimeRange(
  startAt,
  endAt,
  timezone,
  displayDayOfWeek = false
) {
  const now = moment.tz(moment(), timezone)
  const startMoment = moment.tz(startAt, timezone)
  const endMoment = moment.tz(endAt, timezone)
  const startHourFormat = "h:mma"
  const endHourFormat = "h:mma z"
  let monthFormat = "MMM D"
  const dayFormat = "ddd"

  if (
    startMoment.year() !== endMoment.year() ||
    now.year() !== startMoment.year()
  ) {
    // Adds years if the dates are not the same year
    monthFormat = monthFormat.concat(", YYYY")
  }

  if (datesAreSameDay(startAt, endAt, timezone)) {
    return displayDayOfWeek
      ? `${startMoment.format(dayFormat)}, ${startMoment.format(
          monthFormat
        )} from ${timeRange(startAt, endAt, timezone)}`
      : `${startMoment.format(monthFormat)} from ${timeRange(
          startAt,
          endAt,
          timezone
        )}`
  } else {
    return displayDayOfWeek
      ? `${startMoment.format(dayFormat)}, ${startMoment.format(
          monthFormat
        )} at ${startMoment.format(startHourFormat)} – ${endMoment.format(
          dayFormat
        )}, ${endMoment.format(monthFormat)} at ${endMoment.format(
          endHourFormat
        )}`
      : `${startMoment.format(monthFormat)} at ${startMoment.format(
          startHourFormat
        )} – ${endMoment.format(monthFormat)} at ${endMoment.format(
          endHourFormat
        )}`
  }
}

/**
 * A formated date range without hours
 * Nov 1 – 4, 2018
 * Nov 1, 2018 – Jan 4, 2019
 */
export function dateRange(startAt, endAt, timezone, format = "long") {
  const startMoment = moment.tz(startAt, timezone)
  const endMoment = moment.tz(endAt, timezone)
  const monthFormat = format === "short" ? "MMM" : "MMMM"
  let startFormat = monthFormat + " D"
  let endFormat = "D, YYYY"
  const singleDateFormat = monthFormat + " D, YYYY"

  if (startMoment.year() !== endMoment.year()) {
    // Adds year to start date if the dates are not the same year
    startFormat = startFormat.concat(", YYYY")
  }

  if (
    startMoment.month() !== endMoment.month() ||
    startMoment.year() !== endMoment.year()
  ) {
    // Show the end month if the month is different
    endFormat = (monthFormat + " ").concat(endFormat)
  }

  // Duration is the same day
  if (
    startMoment.dayOfYear() === endMoment.dayOfYear() &&
    startMoment.year() === endMoment.year()
  ) {
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
export function exhibitionStatus(startAt, endAt, timezone, max = 5) {
  const today = moment.tz(moment(), timezone).startOf("day")
  return (
    relativeDays(
      "Opening",
      today,
      moment.tz(startAt, timezone).startOf("day"),
      max
    ) ||
    relativeDays(
      "Closing",
      today,
      moment.tz(endAt, timezone).startOf("day"),
      max
    )
  )
}

/**
 * Opens Mar 29 at 4:00pm
 * Closes Apr 3 at 12:30pm
 * Closed
 */
export function formattedOpeningHours(startAt, endAt, timezone) {
  const thisMoment = moment()
  const startMoment = moment.tz(startAt, timezone)
  const endMoment = moment.tz(endAt, timezone)
  if (thisMoment.isBefore(startMoment)) {
    return `Opens ${singleDateTime(startAt, timezone)}`
  } else if (thisMoment.isBefore(endMoment)) {
    return `Closes ${singleDateTime(endAt, timezone)}`
  } else {
    return "Closed"
  }
}

export function cascadingFormattedStartDateTime(
  startAt,
  endAt,
  endedAt,
  timezone
) {
  const tz = timezone || DEFAULT_TZ
  const thisMoment = moment.tz(moment(), tz)
  const lotsClosingMoment = moment.tz(endAt, tz)
  const saleEndMoment = moment.tz(endedAt, tz) // only used for formatting

  if (!!endedAt) return `Closed ${saleEndMoment.format("MMM D, YYYY")}`

  if (thisMoment.isAfter(lotsClosingMoment)) return "Closing soon"

  return dateRange(startAt, endAt, tz, "long")
}

export function auctionsDetailFormattedStartDateTime(
  startAt,
  endAt,
  endedAt,
  liveStartAt,
  timezone
) {
  const tz = timezone || DEFAULT_TZ
  const thisMoment = moment.tz(moment(), tz)
  const saleStartMoment = moment.tz(startAt, tz)
  const lotsClosingMoment = moment.tz(endAt, tz)
  const saleEndMoment = moment.tz(endedAt, tz)
  const liveStartMoment = moment.tz(liveStartAt, tz)

  if (!!endedAt)
    return `Closed ${saleEndMoment.format(
      "MMM D, YYYY"
    )} • ${saleEndMoment.format("h:mma z")}`

  if (thisMoment.isBefore(saleStartMoment))
    return `${saleStartMoment.format("MMM D, YYYY")} • ${saleStartMoment.format(
      "h:mma z"
    )}`
  if (liveStartAt) {
    if (thisMoment.isBefore(liveStartMoment)) {
      return `Live ${liveStartMoment.format(
        "MMM D, YYYY"
      )} • ${liveStartMoment.format("h:mma z")}`
    } else if (
      thisMoment.isAfter(liveStartMoment) &&
      (thisMoment.isBefore(lotsClosingMoment) || !endAt)
    ) {
      return `In progress`
    }
  }
  return `${lotsClosingMoment.format(
    "MMM D, YYYY"
  )} • ${lotsClosingMoment.format("h:mma z")}`
}

export function formattedEndDateTime(endAt, timezone) {
  const tz = timezone || DEFAULT_TZ
  const lotEndMoment = moment.tz(endAt, tz)
  return `Closes on ${lotEndMoment.format("MMM D")} • ${lotEndMoment.format(
    "h:mma z"
  )}`
}

/**
 * Starts Mar 29 at 4:00pm
 * Ends Apr 3 at 12:30pm
 * Ended Apr 3 2017
 */
export function formattedStartDateTime(startAt, endAt, liveStartAt, timezone) {
  const tz = timezone || DEFAULT_TZ
  const thisMoment = moment.tz(moment(), tz)
  const startMoment = moment.tz(startAt, tz)
  const endMoment = moment.tz(endAt, tz)
  const liveStartMoment = moment.tz(liveStartAt, tz)

  if (thisMoment.isBefore(startMoment)) {
    return `Starts ${singleDateTime(startAt, tz)}`
  }

  if (thisMoment.isAfter(endMoment)) {
    return `Ended ${singleDate(endAt, tz)}`
  }

  if (liveStartAt) {
    if (thisMoment.isBefore(liveStartMoment)) {
      return `Live ${singleDateTime(liveStartAt, tz)}`
    } else if (
      thisMoment.isAfter(liveStartMoment) &&
      (thisMoment.isBefore(endMoment) || !endAt)
    ) {
      return `In progress`
    }
  } else if (thisMoment.isBefore(endMoment)) {
    return `Ends ${singleDateTime(endAt, tz)}`
  } else {
    return null
  }
}
