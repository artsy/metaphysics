import moment from "moment"
import { defineCustomLocale } from "lib/helpers"

const LocaleEnAuctionRelative = "en-auction-relative"
defineCustomLocale(LocaleEnAuctionRelative, {
  parentLocale: "en",
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "%ds",
    m: "%dm",
    mm: "%dm",
    h: "%dh",
    hh: "%dh",
    d: "%dd",
    dd: "%dd",
    M: "%dM",
    MM: "%dM",
    y: "%dY",
    yy: "%dY",
  },
})

export const isLiveOpen = (sale) => {
  const liveStart = moment(sale.live_start_at)
  return (
    sale.auction_state === "open" &&
    (moment().isAfter(liveStart) || moment().isSame(liveStart))
  )
}

const hasEnded = (end_at) => {
  return end_at && end_at < moment()
}

export async function displayTimelyAt({ sale, meBiddersLoader }) {
  const { live_start_at, registration_ends_at, start_at, end_at } = sale

  // Don't display any info for past auctions.
  if (hasEnded(end_at)) {
    return null
  }

  // Sale requires registration.
  // Display 'register by' label if there is an unregistered bidder
  // and the registration period is open.
  if (registration_ends_at > moment()) {
    let isRegistered = false

    // Check if there is a logged in user which is registered.
    if (meBiddersLoader) {
      const bidders = await meBiddersLoader({ sale_id: sale.id })
      isRegistered = bidders && bidders.length > 0
    }

    if (!isRegistered) {
      const diff = moment().diff(moment(registration_ends_at), "hours")
      const format = diff > -24 ? "ha" : "MMM D, ha"
      const label = `register by\n${moment(registration_ends_at)
        .locale(LocaleEnAuctionRelative)
        .format(format)}`
      return label
    }
  }

  // Live Auction (already registered or registration closed).
  if (live_start_at) {
    // Auction is currently in progress.
    if (isLiveOpen(sale)) {
      return "in progress"
    }

    // Auction hasn't started yet.
    if (live_start_at) {
      return `live ${moment(live_start_at).fromNow()}`
    }
  }

  // Timed Auction
  if (start_at) {
    const range = moment().add(5, "days")
    const startAt = moment(start_at)
    const isInProgress = startAt < moment()
    const isNearFuture = startAt > moment() && startAt < range
    const isFuture = startAt > range
    const dateLabel = (saleDate) => {
      return moment(saleDate).fromNow(true)
    }

    // In progress, or ends < 5 days away
    if (isInProgress || isNearFuture) {
      return `ends in ${dateLabel(end_at)}`
    }

    // Coming in the future (> 5 days away)
    if (isFuture) {
      return `ends ${moment(end_at)
        .locale(LocaleEnAuctionRelative)
        .format("MMM D")}`
    }
  }
}

const defaultStartAt = !__TEST__
  ? new Date().toISOString()
  : "2020-08-20T02:50:09+00:00"

/**
 * Get sale ending urgency tag
 * @example
 * 2 days left, 12 hours left
 * Auction closed
 */

export const displayUrgencyTag = ({
  endAt,
  auctionState,
  startAt = defaultStartAt,
}: {
  endAt: string
  auctionState: string
  startAt?: string
}): string | null => {
  if (
    auctionState !== "open" ||
    moment(endAt).isSameOrBefore(moment(startAt))
  ) {
    return null
  }

  const timeUntilSaleEnd = getTimeUntil({ endAt })
  return `${timeUntilSaleEnd.timeUntilByByUnit} ${timeUntilSaleEnd.unit} left`
}

export enum TIME_UNITS {
  Months = "months",
  Weeks = "weeks",
  Days = "days",
  Hours = "hours",
  Minutes = "minutes",
}

export const UNITS = [
  TIME_UNITS.Months,
  TIME_UNITS.Weeks,
  TIME_UNITS.Days,
  TIME_UNITS.Hours,
  TIME_UNITS.Minutes,
]

/**
 * Get time until a given date
 * @example
 * { timeUntilByByUnit: 3, unit: days }
 */
export const getTimeUntil = ({
  startAt = defaultStartAt,
  endAt,
  unit = TIME_UNITS.Months,
}: {
  startAt?: string
  endAt: string
  unit?: TIME_UNITS
}): { timeUntilByByUnit: number; unit: TIME_UNITS } => {
  const timeUntilByByUnit = moment(endAt).diff(moment(startAt), unit)

  if (timeUntilByByUnit > 1 || unit === "minutes") {
    return { timeUntilByByUnit, unit }
  }

  return getTimeUntil({ endAt, unit: UNITS[UNITS.indexOf(unit) + 1] })
}
