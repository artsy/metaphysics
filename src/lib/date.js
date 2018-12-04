// @ts-check

import moment from "moment"

export function exhibitionPeriod(startAt, endAt) {
  const startMoment = moment(startAt)
  const endMoment = moment(endAt)
  const thisMoment = moment()

  let startFormat = "MMM D"
  if (startMoment.year() !== endMoment.year()) {
    startFormat = startFormat.concat(", YYYY")
  }

  let endFormat = "D"
  if (endMoment.year() !== thisMoment.year()) {
    endFormat = endFormat.concat(", YYYY")
  }
  if (
    !(
      startMoment.year() === endMoment.year() &&
      startMoment.month() === endMoment.month()
    )
  ) {
    endFormat = "MMM ".concat(endFormat)
  }

  return `${startMoment.format(startFormat)} – ${endMoment.format(endFormat)}`
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
