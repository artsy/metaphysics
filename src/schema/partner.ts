import { assign, flatten, omit } from "lodash"
import { exclude, convertConnectionArgsToGravityArgs } from "lib/helpers"
import cached from "./fields/cached"
import initials from "./fields/initials"
import Profile from "./profile"
import Location from "./location"
import { GravityIDFields, NodeInterface } from "./object_identification"
import Artwork, { artworkConnection } from "./artwork"
import numeral from "./fields/numeral"
import ArtworkSorts from "./sorts/artwork_sorts"
import { pageable } from "relay-cursor-paging"
import { queriedForFieldsOtherThanBlacklisted } from "lib/helpers"

import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { ResolverContext } from "types/graphql"

const PartnerCategoryType = new GraphQLObjectType<any, ResolverContext>({
  name: "Category",
  description: "Fields of partner category (currently from Gravity).",
  fields: {
    ...GravityIDFields,
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

const artworksArgs = {
  for_sale: {
    type: GraphQLBoolean,
  },
  sort: ArtworkSorts,
  exclude: {
    type: new GraphQLList(GraphQLString),
  },
}

const PartnerType = new GraphQLObjectType<any, ResolverContext>({
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
          ...artworksArgs,
          size: {
            type: GraphQLInt,
          },
        },
        resolve: ({ id }, options, { partnerArtworksLoader }) => {
          return partnerArtworksLoader(
            id,
            assign({}, options, {
              published: true,
            })
          )
            .then(({ body }) => body)
            .then(exclude(options.exclude, "id"))
        },
      },
      artworksConnection: {
        description: "A connection of artworks from a Partner.",
        type: artworkConnection,
        args: pageable(artworksArgs),
        resolve: ({ id }, options, { partnerArtworksLoader }) => {
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            options
          )

          interface GravityArgs {
            exclude_ids?: string[]
            page: number
            published: boolean
            size: number
            total_count: boolean
            sort: string
            for_sale: boolean
          }

          const gravityArgs: GravityArgs = {
            published: true,
            total_count: true,
            page,
            size,
            sort: options.sort,
            for_sale: options.for_sale,
          }

          if (options.exclude) {
            gravityArgs.exclude_ids = flatten([options.exclude])
          }

          return partnerArtworksLoader(id, gravityArgs).then(
            ({ body, headers }) => {
              return connectionFromArraySlice(body, options, {
                arrayLength: parseInt(headers["x-total-count"] || "0", 10),
                sliceStart: offset,
              })
            }
          )
        },
      },
      categories: {
        type: new GraphQLList(PartnerCategoryType),
        resolve: ({ partner_categories }) => partner_categories,
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
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "PartnerCounts",
          fields: {
            artworks: numeral(({ artworks_count }) => artworks_count),
            artists: numeral(({ artists_count }) => artists_count),
            partner_artists: numeral(
              ({ partner_artists_count }) => partner_artists_count
            ),
            eligible_artworks: numeral(
              ({ eligible_artworks_count }) => eligible_artworks_count
            ),
            published_for_sale_artworks: numeral(
              ({ published_for_sale_artworks_count }) =>
                published_for_sale_artworks_count
            ),
            published_not_for_sale_artworks: numeral(
              ({ published_not_for_sale_artworks_count }) =>
                published_not_for_sale_artworks_count
            ),
            shows: numeral(({ shows_count }) => shows_count),
            displayable_shows: numeral(
              ({ displayable_shows_count }) => displayable_shows_count
            ),
            current_displayable_shows: numeral(
              ({ current_displayable_shows_count }) =>
                current_displayable_shows_count
            ),
            artist_documents: numeral(
              ({ artist_documents_count }) => artist_documents_count
            ),
            partner_show_documents: numeral(
              ({ partner_show_documents_count }) => partner_show_documents_count
            ),
          },
        }),
        resolve: artist => artist,
      },
      default_profile_id: {
        type: GraphQLString,
      },
      has_fair_partnership: {
        type: GraphQLBoolean,
        resolve: ({ has_fair_partnership }) => has_fair_partnership,
      },
      href: {
        type: GraphQLString,
        resolve: ({ type, default_profile_id }) =>
          type === "Auction"
            ? `/auction/${default_profile_id}`
            : `/${default_profile_id}`,
      },
      initials: initials("name"),
      is_default_profile_public: {
        type: GraphQLBoolean,
        resolve: ({ default_profile_public }) => default_profile_public,
      },
      is_limited_fair_partner: {
        type: GraphQLBoolean,
        deprecationReason:
          "This field no longer exists, this is for backwards compatibility",
        resolve: () => false,
      },
      is_linkable: {
        type: GraphQLBoolean,
        resolve: ({ default_profile_id, default_profile_public, type }) =>
          default_profile_id && default_profile_public && type !== "Auction",
      },
      is_pre_qualify: {
        type: GraphQLBoolean,
        resolve: ({ pre_qualify }) => pre_qualify,
      },
      locations: {
        type: new GraphQLList(Location.type),
        args: {
          size: {
            type: GraphQLInt,
            defaultValue: 25,
          },
        },
        resolve: ({ id }, options, { partnerLocationsLoader }) =>
          partnerLocationsLoader(id, options),
      },
      name: {
        type: GraphQLString,
        resolve: ({ name }) => name.trim(),
      },
      profile: {
        type: Profile.type,
        resolve: ({ default_profile_id }, _options, { profileLoader }) =>
          profileLoader(default_profile_id).catch(() => null),
      },
      shows: {
        type: PartnerShows.type,
        args: omit(PartnerShows.args, "partner_id"),
        resolve: ({ _id }, options) => {
          return PartnerShows.resolve(
            null,
            assign({}, options, {
              partner_id: _id,
            })
          )
        },
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
      website: {
        description: "The gallery partner's web address",
        type: GraphQLString,
        resolve: root => {
          if (root.website) {
            return root.website
          }
        },
      },
    }
  },
})

const Partner: GraphQLFieldConfig<void, ResolverContext> = {
  type: PartnerType,
  description: "A Partner",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Partner",
    },
  },
  resolve: (_root, { id }, { partnerLoader }, { fieldNodes }) => {
    const blacklistedFields = ["analytics"]
    const isSlug = !/[0-9a-f]{24}/.test(id)
    // vortex can only load analytics data by id so if id passed by client is slug load
    // partner from gravity
    if (
      isSlug ||
      queriedForFieldsOtherThanBlacklisted(fieldNodes, blacklistedFields)
    ) {
      return partnerLoader(id)
    }
    return { id, _id: id }
  },
}

export default Partner
