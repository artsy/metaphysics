import { compact } from "lodash"
import moment from "moment-timezone"
import { stripTags } from "lib/helpers"
import { SearchItemRawResponse } from "./SearchItemRawResponse"

const DATE_FORMAT = "MMM Do, YYYY"

export class SearchableItemPresenter {
  private item: SearchItemRawResponse

  constructor(item: SearchItemRawResponse) {
    this.item = item
  }

  formattedDescription(): string | undefined {
    const { description, display } = this.item

    switch (this.displayType()) {
      case "Article":
        return this.formattedArticleDescription()
      case "Fair":
        return this.formattedEventDescription("Art fair")
      case "Auction":
        return this.formattedEventDescription("Sale", "America/New_York")
      case "Artwork":
      case "Feature":
      case "Gallery":
      case "Page":
        return description
      case "Booth":
      case "Show":
        return this.formattedShowDescription()
      case "City":
        return `Browse current exhibitions in ${display}`
      case "Collection":
      case "ArtistSeries":
      case "ViewingRoom":
        return stripTags(description)
      default:
        return undefined
    }
  }

  href(): string {
    const { href, label, id, profile_id, model } = this.item

    if (href) return href
    switch (label) {
      case "Profile":
        return `/${id}`
      case "Fair":
        return `/${profile_id}`
      case "Sale":
        return `/auction/${id}`
      case "City":
        return `/shows/${id}`
      case "MarketingCollection":
        return `/collection/${id}`
      case "Booth":
      case "PartnerShow":
        return `/show/${id}`
      case "ArtistSeries":
        return `/artist-series/${id}`
      case "ViewingRoom":
        return `/viewing-room/${id}`
      default:
        return `/${model}/${id}`
    }
  }

  displayType(): string {
    const { fair_id, label, owner_type } = this.item

    switch (label) {
      case "Profile":
        const institutionTypes = [
          "PartnerInstitution",
          "PartnerInstitutionalSeller",
        ]
        if (institutionTypes.includes(owner_type)) {
          return "Institution"
        } else if (owner_type === "FairOrganizer") {
          return "Fair"
        } else {
          return "Gallery"
        }
      case "Gene":
        return "Category"
      // TODO: How do we correctly display Sale/Auction types?
      // There's nothing to distinguish the two types present
      // in the special `match` JSON returned from the Gravity API.
      case "Sale":
        return "Auction"
      case "PartnerShow":
        return fair_id ? "Booth" : "Show"
      case "MarketingCollection":
        return "Collection"
      case "ArtistSeries":
        return "Artist Series"
      case "ViewingRoom":
        return "Viewing Room"
      default:
        return label
    }
  }

  imageUrl(): string {
    if (this.item.image_url === "/assets/shared/missing_image.png") {
      return ""
    }

    return this.item.image_url
  }

  private formattedEventDescription(title: string, timezone?: string): string {
    const { description, location, live_start_at, start_at, end_at } = this.item

    const formattedStartAt = this.formattedTime(
      live_start_at || start_at,
      DATE_FORMAT,
      timezone
    )
    const formattedEndAt = this.formattedTime(end_at, DATE_FORMAT, timezone)

    if (formattedStartAt && formattedEndAt) {
      let formattedDescription = `${title} running from ${formattedStartAt} to ${formattedEndAt}`
      if (location) {
        formattedDescription += ` in ${location}`
      }
      return formattedDescription
    } else if (formattedStartAt) {
      let formattedDescription = `${title} opening ${formattedStartAt}`
      if (location) {
        formattedDescription += ` in ${location}`
      }
      return formattedDescription
    } else {
      return description
    }
  }

  private formattedArticleDescription(): string {
    const { description, published_at } = this.item

    const formattedPublishedAt = this.formattedTime(published_at, DATE_FORMAT)

    if (formattedPublishedAt && description) {
      return `${formattedPublishedAt} ... ${description}`
    } else if (formattedPublishedAt) {
      return formattedPublishedAt
    } else {
      return description
    }
  }

  private formattedTime(
    timestamp: string,
    format: string,
    timezone?: string
  ): string | null {
    const momentTime = moment.utc(timestamp)

    if (!momentTime.isValid()) {
      return null
    } else if (timezone) {
      return `${momentTime.tz(timezone).format(format)} (at ${momentTime.format(
        "h:mma z"
      )})`
    } else {
      return momentTime.format(format)
    }
  }

  private formattedShowDescription(): string {
    const { location, venue } = this.item

    const leadHeading = this.formattedLeadHeading()
    const runningTime = this.formattedRunningTime()

    let artistNames = this.formattedArtistNames()
    if (artistNames) {
      artistNames = `featuring works by ${artistNames}`
    }

    let formattedVenue = venue
    if (formattedVenue) {
      formattedVenue = `at ${formattedVenue}`
    }

    return compact([
      leadHeading,
      artistNames,
      formattedVenue,
      location,
      runningTime,
    ]).join(" ")
  }

  private formattedArtistNames(): string {
    const { artist_names } = this.item

    if (artist_names.length > 1) {
      return `${artist_names
        .slice(0, artist_names.length - 1)
        .join(", ")} and ${artist_names[artist_names.length - 1]}`
    } else {
      return artist_names[0]
    }
  }

  private formattedLeadHeading(): string {
    const { fair_id, start_at, end_at } = this.item

    if (!start_at || !end_at) {
      return fair_id ? "Fair booth" : "Show"
    }

    const now = moment.utc().startOf("day")
    const startAt = moment.utc(start_at)
    const endAt = moment.utc(end_at)

    const startDiff = startAt.diff(now, "days")
    const endDiff = endAt.diff(now, "days")

    let statusLabel: string
    if (startDiff < 0 && endDiff < 0) {
      statusLabel = "Past"
    } else if (startDiff > 0) {
      statusLabel = "Upcoming"
    } else {
      statusLabel = "Current"
    }

    const type = fair_id ? "fair booth" : "show"

    return `${statusLabel} ${type}`
  }

  private formattedRunningTime(): string {
    const { start_at, end_at } = this.item

    if (!start_at || !end_at) {
      return ""
    }

    const startAt = moment.utc(start_at)
    const endAt = moment.utc(end_at)

    const startMonth = startAt.format("MMM")
    const startDay = startAt.format("Do")

    const endMonth = endAt.format("MMM")
    const endDay = endAt.format("Do")

    let monthAndDate: string
    if (startAt.year() === endAt.year()) {
      if (
        startAt.month() === endAt.month() &&
        startAt.date() === endAt.date()
      ) {
        monthAndDate = `${startMonth} ${startDay}`
      } else if (startAt.month() === endAt.month()) {
        monthAndDate = `${startMonth} ${startDay} – ${endDay}`
      } else {
        monthAndDate = `${startMonth} ${startDay} – ${endMonth} ${endDay}`
      }

      if (startAt.year() !== moment.utc().year()) {
        return `${monthAndDate} ${startAt.year()}`
      } else {
        return monthAndDate
      }
    } else
      return `${startMonth} ${startDay}, ${startAt.format(
        "YYYY"
      )} – ${endMonth} ${endDay}, ${endAt.format("YYYY")}`
  }
}
