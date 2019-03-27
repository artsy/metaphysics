import moment from "moment"
import { stripTags } from "lib/helpers"

export class SearchableItemPresenter {
  private item: any

  constructor(item: any) {
    this.item = item
  }

  formattedDescription(): string | undefined {
    const { description, display } = this.item

    switch (this.item.label) {
      case "Article":
        return this.formattedArticleDescription()
      case "Fair":
        return this.formatEventDescription("Art fair")
      case "Sale":
        return this.formatEventDescription("Sale")
      case "Artwork":
      case "Feature":
      case "Gallery":
      case "Page":
        return description
      case "City":
        return `Browse current exhibitions in ${display}`
      case "MarketingCollection":
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
      default:
        return `/${model}/${id}`
    }
  }

  searchableType(): string {
    const { label, owner_type } = this.item

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
      case "MarketingCollection":
        return "Collection"
      default:
        return label
    }
  }

  private formatEventDescription(title: string): string {
    const { description, location, start_at, end_at } = this.item

    const formattedStartAt = moment.utc(start_at).format("MMM Do, YYYY")
    const formattedEndAt = moment.utc(end_at).format("MMM Do, YYYY")

    if (start_at && end_at) {
      let formattedDescription = `${title} running from ${formattedStartAt} to ${formattedEndAt}`
      if (location) {
        formattedDescription += ` in ${location}`
      }
      return formattedDescription
    } else if (start_at) {
      return `${title} opening ${formattedStartAt}`
    } else {
      return description
    }
  }

  private formattedArticleDescription(): string {
    const { description, published_at } = this.item

    let formattedPublishedAt
    if (published_at) {
      formattedPublishedAt = moment.utc(published_at).format("MMM Do, YYYY")
    }

    if (published_at && description) {
      return `${formattedPublishedAt} ... ${description}`
    } else if (published_at) {
      return formattedPublishedAt
    } else {
      return description
    }
  }
}
