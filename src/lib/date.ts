import moment from "moment"

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
    return `${momentDate}`
  }
}

export function formattedOpeningHours(startAt, endAt) {
  const thisMoment = moment()
  const startMoment = moment(startAt)
  const endMoment = moment(endAt)
  if (thisMoment.isBefore(startMoment)) {
    return `Opens ${formattedOpeningHoursDate(startAt)}`
  } else if (thisMoment.isBefore(endMoment)) {
    return `Closes ${formattedOpeningHoursDate(endAt)}`
  } else {
    return "Closed"
  }
}

export function exhibitionPeriod(startAt, endAt) {
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
    return `${endMoment.format(singleDateFormat)}`
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

export function exhibitionStatus(startAt, endAt, max = 5) {
  const today = moment().startOf("day")
  return (
    relativeDays("Opening", today, moment(startAt).startOf("day"), max) ||
    relativeDays("Closing", today, moment(endAt).startOf("day"), max)
  )
}
