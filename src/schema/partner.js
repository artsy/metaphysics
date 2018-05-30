import { assign, omit } from "lodash"
import { exclude } from "lib/helpers"
import cached from "./fields/cached"
import initials from "./fields/initials"
import Profile from "./profile"
import Location from "./location"
import { GravityIDFields, NodeInterface } from "./object_identification"
import Artwork from "./artwork"
import numeral from "./fields/numeral"
import ArtworkSorts from "./sorts/artwork_sorts"
import {
  graphql,
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean,
} from "graphql"

const PartnerCategoryType = new GraphQLObjectType({
  name: "Category",
  description: "Fields of partner category (currently from Gravity).",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    category_type: {
      type: GraphQLString,
    },
    internal: {
      type: GraphQLBoolean,
    },
    name: {
      type: GraphQLString,
    },
  },
})

const PartnerType = new GraphQLObjectType({
  name: "Partner",
  interfaces: [NodeInterface],
  fields: () => {
    // Prevent circular dependency
    const PartnerShows = require("./partner_shows").default

    return {
      ...GravityIDFields,
      cached,
      artworks: {
        type: new GraphQLList(Artwork.type),
        args: {
          size: {
            type: GraphQLInt,
          },
          for_sale: {
            type: GraphQLBoolean,
          },
          sort: ArtworkSorts,
          exclude: {
            type: new GraphQLList(GraphQLString),
          },
        },
        resolve: (
          { id },
          options,
          request,
          { rootValue: { partnerArtworksLoader } }
        ) =>
          {return partnerArtworksLoader(
            id,
            assign({}, options, {
              published: true,
            })
          ).then(exclude(options.exclude, "id"))},
      },
      categories: {
        type: new GraphQLList(PartnerCategoryType),
        resolve: ({ partner_categories }) => {return partner_categories},
      },
      collecting_institution: {
        type: GraphQLString,
      },
      contact_message: {
        type: GraphQLString,
        deprecationReason:
          "Prefer artwork contact_message to handle availability-based prompts.",
        resolve: ({ type }) => {
          if (type === "Auction") {
            return [
              "Hello, I am interested in placing a bid on this work.",
              "Please send me more information.",
            ].join(" ")
          }
          return [
            "Hi, I’m interested in purchasing this work.",
            "Could you please provide more information about the piece?",
          ].join(" ")
        },
      },
      counts: {
        type: new GraphQLObjectType({
          name: "PartnerCounts",
          fields: {
            artworks: numeral(({ artworks_count }) => {return artworks_count}),
            artists: numeral(({ artists_count }) => {return artists_count}),
            partner_artists: numeral(
              ({ partner_artists_count }) => {return partner_artists_count}
            ),
            eligible_artworks: numeral(
              ({ eligible_artworks_count }) => {return eligible_artworks_count}
            ),
            published_for_sale_artworks: numeral(
              ({ published_for_sale_artworks_count }) =>
                {return published_for_sale_artworks_count}
            ),
            published_not_for_sale_artworks: numeral(
              ({ published_not_for_sale_artworks_count }) =>
                {return published_not_for_sale_artworks_count}
            ),
            shows: numeral(({ shows_count }) => {return shows_count}),
            displayable_shows: numeral(
              ({ displayable_shows_count }) => {return displayable_shows_count}
            ),
            current_displayable_shows: numeral(
              ({ current_displayable_shows_count }) =>
                {return current_displayable_shows_count}
            ),
            artist_documents: numeral(
              ({ artist_documents_count }) => {return artist_documents_count}
            ),
            partner_show_documents: numeral(
              ({ partner_show_documents_count }) => {return partner_show_documents_count}
            ),
          },
        }),
        resolve: artist => {return artist},
      },
      default_profile_id: {
        type: GraphQLString,
      },
      has_fair_partnership: {
        type: GraphQLBoolean,
        resolve: ({ has_fair_partnership }) => {return has_fair_partnership},
      },
      href: {
        type: GraphQLString,
        resolve: ({ type, default_profile_id }) =>
          {return type === "Auction"
            ? `/auction/${default_profile_id}`
            : `/${default_profile_id}`},
      },
      initials: initials("name"),
      is_default_profile_public: {
        type: GraphQLBoolean,
        resolve: ({ default_profile_public }) => {return default_profile_public},
      },
      is_limited_fair_partner: {
        type: GraphQLBoolean,
        deprecationReason:
          "This field no longer exists, this is for backwards compatibility",
        resolve: () => {return false},
      },
      is_linkable: {
        type: GraphQLBoolean,
        resolve: ({ default_profile_id, default_profile_public, type }) =>
          {return default_profile_id && default_profile_public && type !== "Auction"},
      },
      is_pre_qualify: {
        type: GraphQLBoolean,
        resolve: ({ pre_qualify }) => {return pre_qualify},
      },
      locations: {
        type: new GraphQLList(Location.type),
        args: {
          size: {
            type: GraphQLInt,
            defaultValue: 25,
          },
        },
        resolve: (
          { id },
          options,
          request,
          { rootValue: { partnerLocationsLoader } }
        ) => {return partnerLocationsLoader(id, options)},
      },
      name: {
        type: GraphQLString,
        resolve: ({ name }) => {return name.trim()},
      },
      profile: {
        type: Profile.type,
        resolve: (
          { default_profile_id },
          options,
          request,
          { rootValue: { profileLoader } }
        ) => {return profileLoader(default_profile_id).catch(() => {return null})},
      },
      shows: {
        type: PartnerShows.type,
        args: omit(PartnerShows.args, "partner_id"),
        resolve: ({ _id }, options) =>
          {return PartnerShows.resolve(
            null,
            assign({}, options, {
              partner_id: _id,
            })
          )},
      },
      type: {
        type: GraphQLString,
        resolve: ({ name, type }) => {
          const exceptions = {
            Auction: "Auction House",
            Brand: name,
            "Institutional Seller": "Institution",
          }

          return exceptions[type] || type
        },
      },
      acceptsCardPayments: {
        type: GraphQLBoolean,
        resolve: (
          partner,
          _args,
          _request,
          { rootValue: { lewittSchema } }
        ) => {
          const { _id, payments_enabled } = partner
          if (!payments_enabled) {
            return false
          }
          const query = `
            query MerchantAccountQuery($partner_id: String!) {
              partner_product_merchant_account(partner_id: $partner_id) {
                credit_card_enabled
              }
            }
          `
          return graphql(lewittSchema, query, null, null, {
            partner_id: _id,
          }).then(response => {
            if (response.errors) {
              // Something is off in Lewitt so cards are not accepted at the moment
              return false
            }
            const { data: { partner_product_merchant_account } } = response
            return partner_product_merchant_account.credit_card_enabled
          })
        },
      },
    }
  },
})

const Partner = {
  type: PartnerType,
  description: "A Partner",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Partner",
    },
  },
  resolve: (root, { id }, _request, { rootValue: { partnerLoader } }) =>
    {return partnerLoader(id)},
}

export default Partner
