import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLNonNull,
} from "graphql"
import { toGlobalId } from "graphql-relay"
import { Searchable } from "schema/searchable"
import { NodeInterface, GravityIDFields } from "schema/object_identification"
import { ResolverContext } from "types/graphql"
import { stripTags } from "lib/helpers"
import moment from "moment"
import { exhibitionPeriod } from "lib/date"

const hrefFromAutosuggestResult = item => {
  if (item.href) return item.href
  switch (item.label) {
    case "Profile":
      return `/${item.id}`
    case "Fair":
      return `/${item.profile_id}`
    case "Sale":
      return `/auction/${item.id}`
    case "City":
      return `/shows/${item.id}`
    case "MarketingCollection":
      return `/collection/${item.id}`
    default:
      return `/${item.model}/${item.id}`
  }
}

export const SearchableItem = new GraphQLObjectType<any, ResolverContext>({
  name: "SearchableItem",
  interfaces: [NodeInterface, Searchable],
  fields: {
    ...GravityIDFields,
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: item => toGlobalId("SearchableItem", item._id),
    },
    description: {
      type: GraphQLString,
      resolve: ({
        description,
        display,
        end_at,
        label,
        published_at,
        start_at,
      }) => {
        switch (label) {
          case "Article":
            let formattedPublishedAt
            if (published_at) {
              formattedPublishedAt = moment
                .utc(published_at)
                .format("MMM Do, YYYY")
            }

            if (published_at && description) {
              return `${formattedPublishedAt} ... ${description}`
            } else if (published_at) {
              return formattedPublishedAt
            } else {
              return description
            }
          case "City":
            return `Browse current exhibitions in ${display}`
          case "Fair":
          case "Sale":
            const period = exhibitionPeriod(start_at, end_at)

            return `Sale running from ${period}`
          case "Show":
          case "Booth":
            return ""
          default:
            if (!description || description.length === 0) {
              return null
            } else {
              return stripTags(description)
            }
        }
      },
    },
    displayLabel: {
      type: GraphQLString,
      resolve: item => item.display,
    },
    imageUrl: {
      type: GraphQLString,
      resolve: item => item.image_url,
    },
    href: {
      type: GraphQLString,
      resolve: item => hrefFromAutosuggestResult(item),
    },
    searchableType: {
      type: GraphQLString,
      resolve: ({ label, owner_type }) => {
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
      },
    },
  },
})
