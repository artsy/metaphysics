import moment from "moment-timezone"
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
  return end_at && moment(end_at) < moment()
}

export async function displayTimelyAt({ sale, meBiddersLoader, timeZone }) {
  const { live_start_at, registration_ends_at, start_at, end_at } = sale

  // Don't display any info for past auctions.
  if (hasEnded(end_at)) {
    return null
  }

  // Sale requires registration.
  // Display 'Register by' label if there is an unregistered bidder
  // and the registration period is open.
  if (registration_ends_at && moment(registration_ends_at) > moment()) {
    let isRegistered = false

    // Check if there is a logged in user which is registered.
    if (meBiddersLoader) {
      const bidders = await meBiddersLoader({ sale_id: sale.id })
      isRegistered = bidders && bidders.length > 0
    }

    if (!isRegistered) {
      const diff = moment().diff(moment(registration_ends_at), "hours")
      const format = diff > -24 ? "h:mma" : "MMM D, h:mma"
      const label = `Register by\n${moment(registration_ends_at)
        .tz(timeZone)
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
        .tz(timeZone)
        .locale(LocaleEnAuctionRelative)
        .format("MMM D")}`
    }
  }
}
