import { pageable } from "relay-cursor-paging"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { flatten } from "lodash"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import cached from "./fields/cached"
import initials from "./fields/initials"
import Profile from "./profile"
import { locationsConnection, LocationType } from "./location"
import EventStatus from "schema/v2/input_fields/event_status"
import { NodeInterface, SlugAndInternalIDFields } from "./object_identification"
import { artworkConnection } from "./artwork"
import numeral from "./fields/numeral"
import { ShowsConnection } from "./show"
import { ArtistType } from "./artist"
import ArtworkSorts from "./sorts/artwork_sorts"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"
import { ResolverContext } from "types/graphql"
import { PartnerCategoryType } from "./partner_category"
import ShowSorts from "./sorts/show_sorts"
import ArtistSorts from "./sorts/artist_sorts"
import { fields as partnerArtistFields } from "./partner_artist"
import { connectionWithCursorInfo } from "./fields/pagination"
import { deprecate } from "lib/deprecation"

const artworksArgs: GraphQLFieldConfigArgumentMap = {
  artworkIDs: {
    type: new GraphQLList(GraphQLString),
    description: "Return only artwork(s) included in this list of IDs.",
  },
  exclude: {
    type: new GraphQLList(GraphQLString),
  },
  forSale: {
    type: GraphQLBoolean,
  },
  imageCountLessThan: {
    type: GraphQLInt,
    description: "Return artworks with less than x additional_images.",
  },
  missingPriorityMetadata: {
    type: GraphQLBoolean,
    description: "Return artworks that are missing priority metadata",
  },
  publishedWithin: {
    type: GraphQLInt,
    description: "Return artworks published less than x seconds ago.",
  },
  sort: ArtworkSorts,
  shallow: {
    type: GraphQLBoolean,
    description:
      "Only allowed for authorized admin/partner requests. When false fetch :all properties on an artwork, when true or not present fetch artwork :short properties",
  },
}

export const PartnerType = new GraphQLObjectType<any, ResolverContext>({
  name: "Partner",
  interfaces: [NodeInterface],
  fields: () => {
    // This avoids a circular require
    const ArtistPartnerConnection = connectionWithCursorInfo({
      name: "ArtistPartner",
      nodeType: ArtistType,
      edgeFields: partnerArtistFields,
    }).connectionType

    const { filterArtworksConnection } = require("./filterArtworksConnection")

    return {
      ...SlugAndInternalIDFields,
      cached,
      artistsConnection: {
        description: "A connection of artists at a partner.",
        type: ArtistPartnerConnection,
        args: pageable({
          sort: ArtistSorts,
          representedBy: {
            type: GraphQLBoolean,
          },
        }),
        resolve: ({ id }, args, { partnerArtistsForPartnerLoader }) => {
          const pageOptions = convertConnectionArgsToGravityArgs(args)
          const { page, size, offset } = pageOptions

          interface GravityArgs {
            page: number
            size: number
            total_count: boolean
            sort: string
            represented_by: boolean
          }

          const gravityArgs: GravityArgs = {
            total_count: true,
            page,
            size,
            sort: args.sort,
            represented_by: args.representedBy,
          }

          return partnerArtistsForPartnerLoader(id, gravityArgs).then(
            ({ body, headers }) => {
              return connectionFromArraySlice(body, args, {
                arrayLength: parseInt(headers["x-total-count"] || "0", 10),
                sliceStart: offset,
                resolveNode: (node) => node.artist,
              })
            }
          )
        },
      },
      artworksConnection: {
        description: "A connection of artworks from a Partner.",
        type: artworkConnection.connectionType,
        args: pageable(artworksArgs),
        resolve: (
          { id },
          args,
          { partnerArtworksLoader, partnerArtworksAllLoader }
        ) => {
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          interface GravityArgs {
            artwork_id?: string[]
            exclude_ids?: string[]
            for_sale: boolean
            image_count_less_than?: number
            missing_priority_metadata?: boolean
            page: number
            published: boolean
            published_within?: number
            size: number
            sort: string
            total_count: boolean
          }

          const gravityArgs: GravityArgs = {
            for_sale: args.forSale,
            image_count_less_than: args.imageCountLessThan,
            missing_priority_metadata: args.missingPriorityMetadata,
            page,
            published: true,
            published_within: args.publishedWithin,
            size,
            sort: args.sort,
            total_count: true,
          }

          if (args.exclude) {
            gravityArgs.exclude_ids = flatten([args.exclude])
          }
          if (args.artworkIDs) {
            gravityArgs.artwork_id = flatten([args.artworkIDs])
          }

          // Only accept shallow = false argument if requesting user is authorized admin/partner
          if (args.shallow === false && partnerArtworksAllLoader) {
            return partnerArtworksLoader(id, gravityArgs).then(
              ({ body, headers }) => {
                const artworkIds = body.map((artwork) => artwork._id)
                const gravityArtworkArgs = {
                  artwork_id: artworkIds,
                }

                return partnerArtworksAllLoader(id, gravityArtworkArgs).then(
                  ({ body }) => {
                    return connectionFromArraySlice(body, args, {
                      arrayLength: parseInt(
                        headers["x-total-count"] || "0",
                        10
                      ),
                      sliceStart: offset,
                    })
                  }
                )
              }
            )
          }

          return partnerArtworksLoader(id, gravityArgs).then(
            ({ body, headers }) => {
              return connectionFromArraySlice(body, args, {
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
      collectingInstitution: {
        type: GraphQLString,
        resolve: ({ collecting_institution }) => collecting_institution,
      },
      counts: {
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "PartnerCounts",
          fields: {
            artworks: numeral(({ artworks_count }) => artworks_count),
            artists: numeral(({ artists_count }) => artists_count),
            partnerArtists: numeral(
              ({ partner_artists_count }) => partner_artists_count
            ),
            eligibleArtworks: numeral(
              ({ eligible_artworks_count }) => eligible_artworks_count
            ),
            publishedForSaleArtworks: numeral(
              ({ published_for_sale_artworks_count }) =>
                published_for_sale_artworks_count
            ),
            publishedNotForSaleArtworks: numeral(
              ({ published_not_for_sale_artworks_count }) =>
                published_not_for_sale_artworks_count
            ),
            shows: numeral(({ shows_count }) => shows_count),
            displayableShows: numeral(
              ({ displayable_shows_count }) => displayable_shows_count
            ),
            currentDisplayableShows: numeral(
              ({ current_displayable_shows_count }) =>
                current_displayable_shows_count
            ),
            artistDocuments: numeral(
              ({ artist_documents_count }) => artist_documents_count
            ),
            partnerShowDocuments: numeral(
              ({ partner_show_documents_count }) => partner_show_documents_count
            ),
          },
        }),
        resolve: (artist) => artist,
      },
      cities: {
        description: "A list of the partners unique city locations",
        type: new GraphQLList(GraphQLString),
        args: {
          size: {
            type: GraphQLInt,
            defaultValue: 25,
          },
        },
        resolve: ({ id }, options, { partnerLocationsConnectionLoader }) => {
          return partnerLocationsConnectionLoader(id, {
            total_count: true,
            ...options,
          }).then((locations) => {
            const locationCities = locations.body.map((location) => {
              return location.city
            })
            const filteredForDuplicatesAndBlanks = locationCities.filter(
              (city, pos) => {
                return (
                  city &&
                  locationCities.indexOf(city) === pos &&
                  city.length > 0
                )
              }
            )
            return filteredForDuplicatesAndBlanks
          })
        },
      },
      defaultProfileID: {
        type: GraphQLString,
        resolve: ({ default_profile_id }) => default_profile_id,
      },
      filterArtworksConnection: filterArtworksConnection("partner_id"),
      hasFairPartnership: {
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
      isDefaultProfilePublic: {
        type: GraphQLBoolean,
        resolve: ({ default_profile_public }) => default_profile_public,
      },
      isLinkable: {
        type: GraphQLBoolean,
        resolve: ({ default_profile_id, default_profile_public, type }) =>
          default_profile_id && default_profile_public && type !== "Auction",
      },
      isPreQualify: {
        type: GraphQLBoolean,
        resolve: ({ pre_qualify }) => pre_qualify,
      },
      locations: {
        type: new GraphQLList(LocationType),
        description:
          "This field is deprecated and is being used in Eigen release predating the 6.0 release",
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "locationsConnection",
        }),
        args: {
          size: {
            type: GraphQLInt,
            defaultValue: 25,
          },
        },
        resolve: ({ id }, options, { partnerLocationsLoader }) =>
          partnerLocationsLoader(id, options),
      },
      locationsConnection: {
        description: "A connection of locations from a Partner.",
        type: locationsConnection.connectionType,
        args: pageable({}),
        resolve: ({ id }, args, { partnerLocationsConnectionLoader }) => {
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const gravityArgs = {
            published: true,
            total_count: true,
            page,
            size,
          }

          return partnerLocationsConnectionLoader(id, gravityArgs).then(
            ({ body, headers }) => {
              const totalCount = parseInt(headers["x-total-count"] || "0", 10)
              return {
                totalCount,
                ...connectionFromArraySlice(body, args, {
                  arrayLength: totalCount,
                  sliceStart: offset,
                }),
              }
            }
          )
        },
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
      showsConnection: {
        description: "A connection of shows from a Partner.",
        type: ShowsConnection.connectionType,
        args: pageable({
          atAFair: {
            type: GraphQLBoolean,
            description:
              "True for only shows that are part of a fair, false for only shows not part of a fair, blank for all shows",
          },
          dayThreshold: {
            type: GraphQLInt,
            description:
              "Only used when status is CLOSING_SOON or UPCOMING. Number of days used to filter upcoming and closing soon shows",
          },
          sort: {
            type: ShowSorts,
          },
          status: {
            type: EventStatus.type,
            defaultValue: "current",
            description: "Filter shows by chronological event status",
          },
        }),
        resolve: ({ id }, args, { partnerShowsLoader }) => {
          const pageOptions = convertConnectionArgsToGravityArgs(args)
          const { page, size, offset } = pageOptions

          interface GravityArgs {
            at_a_fair: boolean
            day_threshold: number
            page: number
            size: number
            sort: string
            status: string
            total_count: boolean
          }

          const gravityArgs: GravityArgs = {
            at_a_fair: args.atAFair,
            total_count: true,
            page,
            size,
            sort: args.sort,
            status: args.status,
            day_threshold: args.dayThreshold,
          }

          return partnerShowsLoader(id, gravityArgs).then(
            ({ body, headers }) => {
              return connectionFromArraySlice(body, args, {
                arrayLength: parseInt(headers["x-total-count"] || "0", 10),
                sliceStart: offset,
              })
            }
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
        resolve: (root) => {
          if (root.website) {
            return root.website
          }
        },
      },
      isVerifiedSeller: {
        description: "Indicates the partner is a trusted seller on Artsy",
        type: GraphQLBoolean,
        resolve: ({ verified_seller }) => verified_seller,
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
  resolve: (_root, { id }, { partnerLoader }, info) => {
    const fieldsNotRequireLoader = ["internalID"]
    const isSlug = !/[0-9a-f]{24}/.test(id)
    // vortex can only load analytics data by id so if id passed by client is slug load
    // partner from gravity
    if (
      isSlug ||
      includesFieldsOtherThanSelectionSet(info, fieldsNotRequireLoader)
    ) {
      return partnerLoader(id)
    }
    return { id, _id: id }
  },
}

export default Partner
