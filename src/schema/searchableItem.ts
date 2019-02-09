import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLNonNull,
} from "graphql"
import { toGlobalId } from "graphql-relay"
import { Searchable } from "schema/searchable"
import { NodeInterface, GravityIDFields } from "schema/object_identification"

export const SearchableItem = new GraphQLObjectType({
  name: "SearchableItem",
  interfaces: [NodeInterface, Searchable],
  fields: {
    ...GravityIDFields,
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: item => toGlobalId("SearchableItem", item._id),
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
      resolve: item => {
        switch (item.label) {
          case "Artwork":
            return `/artwork/${item.id}`
          case "Artist":
            return `/artist/${item.id}`
          default:
            return ""
        }
      },
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

          default:
            return label
        }
      },
    },
  },
})
