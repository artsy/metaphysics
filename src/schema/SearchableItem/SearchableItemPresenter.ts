import { stripTags } from "lib/helpers"

import moment from "moment"
import { exhibitionPeriod } from "lib/date"

export class SearchableItemPresenter {
  private item: any

  constructor(item: any) {
    this.item = item
  }

  formattedDescription(): string | null {
    const { description, display, end_at, start_at } = this.item

    switch (this.item.label) {
      case "Article":
        return this.formattedArticleDescription()
      case "City":
        return `Browse current exhibitions in ${display}`
      case "Fair":
        const period = exhibitionPeriod(start_at, end_at)

        return `Sale running from ${period}`
      default:
        if (!description || description.length === 0) {
          return null
        } else {
          return stripTags(description)
        }
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

  private formattedArticleDescription(): string | null {
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
