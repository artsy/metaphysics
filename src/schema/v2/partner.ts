import { CursorPageable, pageable } from "relay-cursor-paging"
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
import { ShowsConnection, ShowType } from "./show"
import { ArtistType } from "./artist"
import ArtworkSorts from "./sorts/artwork_sorts"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"
import { ResolverContext } from "types/graphql"
import { PartnerCategoryType } from "./partner_category"
import ShowSorts from "./sorts/show_sorts"
import ArtistSorts from "./sorts/artist_sorts"
import { fields as partnerArtistFields } from "./partner_artist"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "./fields/pagination"
import { deprecate } from "lib/deprecation"
import { articleConnection } from "./article"
import ArticleSorts, { ArticleSort } from "./sorts/article_sorts"
import { allViaLoader } from "lib/all"

import { truncate } from "lib/helpers"
import { setVersion } from "./image/normalize"
import { compact } from "lodash"
import { InquiryRequestType } from "./partnerInquirerCollectorProfile"

const isFairOrganizer = (type) => type === "FairOrganizer"
const isGallery = (type) => type === "PartnerGallery"
const isPartner = (type) => isGallery(type) || isInstitution(type)
const isInstitution = (type) =>
  ["PartnerBrand", "PartnerInstitution", "PartnerInstitutionalSeller"].includes(
    type
  )

const partnerTitleContent = (type) => {
  let result: string | undefined

  if (type) {
    if (isPartner(type) && !isFairOrganizer(type)) {
      result = isGallery(type)
        ? "Artists, Art for Sale, and Contact Info"
        : "Artists, Artworks, and Contact Info"
    }

    if (isFairOrganizer(type)) {
      result = "Fair Info, Artists, and Art for Sale"
    }
  }

  return result
}

const artworksArgs: GraphQLFieldConfigArgumentMap = {
  artworkIDs: {
    type: new GraphQLList(GraphQLString),
    description: "Return only artwork(s) included in this list of IDs.",
  },
  artistID: {
    type: GraphQLString,
    description: "Return only artworks by this artist.",
  },
  exclude: {
    type: new GraphQLList(GraphQLString),
  },
  forSale: {
    type: GraphQLBoolean,
  },
  missingPriorityMetadata: {
    type: GraphQLBoolean,
    description: "Return artworks that are missing priority metadata",
  },
  publishedWithin: {
    type: GraphQLInt,
    description: "Return artworks published less than x seconds ago.",
  },
  includeUnpublished: {
    type: GraphQLBoolean,
    description:
      "If true return both published and unpublished artworks, requires auth",
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

    const {
      partnerArtistsMatchConnection,
      partnerArtworksMatchConnection,
      partnerShowsMatchConnection,
    } = require("./PartnerMatch")

    return {
      ...SlugAndInternalIDFields,
      cached,
      articlesConnection: {
        description: "A connection of articles related to a partner.",
        type: articleConnection.connectionType,
        args: pageable({
          sort: ArticleSorts,
          page: { type: GraphQLInt },
          inEditorialFeed: {
            type: GraphQLBoolean,
            description:
              "Get only articles with 'standard', 'feature', 'series' or 'video' layouts.",
          },
        }),
        resolve: async (
          { _id },
          args: {
            inEditorialFeed?: boolean
            sort?: ArticleSort
          } & CursorPageable,
          { articlesLoader }
        ) => {
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          interface ArticleArgs {
            published: boolean
            partner_id: string
            limit: number
            count: boolean
            offset: number
            sort?: ArticleSort
            in_editorial_feed?: boolean
          }

          const articleArgs: ArticleArgs = {
            published: true,
            partner_id: _id,
            limit: size,
            count: true,
            offset,
            sort: args.sort,
            in_editorial_feed: args.inEditorialFeed,
          }

          const { results, count } = await articlesLoader(articleArgs)

          return {
            totalCount: count,
            pageCursors: createPageCursors({ ...args, page, size }, count),
            ...connectionFromArraySlice(results, args, {
              arrayLength: count,
              sliceStart: offset,
            }),
          }
        },
      },
      allArtistsConnection: {
        description: "A connection of all artists from a Partner.",
        type: ArtistPartnerConnection,
        args: {
          representedBy: {
            type: GraphQLBoolean,
          },
          displayOnPartnerProfile: {
            type: GraphQLBoolean,
          },
          hasPublishedArtworks: {
            type: GraphQLBoolean,
          },
          hasNotRepresentedArtistWithPublishedArtworks: {
            type: GraphQLBoolean,
          },
          includeAllFields: {
            type: GraphQLBoolean,
            description:
              "Include additional fields on artists, requires authentication",
          },
        },
        resolve: (
          { id },
          args,
          { partnerArtistsForPartnerLoader, partnerArtistsAllLoader }
        ) => {
          interface GravityArgs {
            sort: string
            represented_by: boolean
            display_on_partner_profile: boolean
            has_published_artworks: boolean
          }

          const gravityArgs: GravityArgs = {
            sort: args.sort,
            represented_by: args.representedBy,
            display_on_partner_profile: args.displayOnPartnerProfile,
            has_published_artworks: args.hasPublishedArtworks,
          }

          // use the all loader to get additional fields if requested
          const partnerArtistsLoader = args.includeAllFields
            ? partnerArtistsAllLoader
            : partnerArtistsForPartnerLoader

          return allViaLoader(partnerArtistsLoader, {
            path: id,
            params: gravityArgs,
          })
            .then((body) => {
              return body.filter((item) =>
                args.hasNotRepresentedArtistWithPublishedArtworks &&
                !item.represented_by
                  ? item.published_artworks_count > 0
                  : true
              )
            })
            .then((body) => {
              return {
                totalCount: body.length,
                ...connectionFromArraySlice(body, args, {
                  arrayLength: body.length,
                  sliceStart: 0,
                  resolveNode: (node) => node.artist,
                }),
              }
            })
        },
      },
      artistsConnection: {
        description: "A connection of artists at a partner.",
        type: ArtistPartnerConnection,
        args: pageable({
          sort: ArtistSorts,
          representedBy: {
            type: GraphQLBoolean,
          },
          displayOnPartnerProfile: {
            type: GraphQLBoolean,
          },
          hasPublishedArtworks: {
            type: GraphQLBoolean,
          },
          artistIDs: {
            type: new GraphQLList(GraphQLString),
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
            display_on_partner_profile: boolean
            artist_ids: [string]
            has_published_artworks: boolean
          }

          const gravityArgs: GravityArgs = {
            total_count: true,
            page,
            size,
            sort: args.sort,
            represented_by: args.representedBy,
            display_on_partner_profile: args.displayOnPartnerProfile,
            artist_ids: args.artistIDs,
            has_published_artworks: args.hasPublishedArtworks,
          }

          return partnerArtistsForPartnerLoader(id, gravityArgs).then(
            ({ body, headers }) => {
              const totalCount = parseInt(headers["x-total-count"] || "0", 10)

              return {
                totalCount,
                ...connectionFromArraySlice(body, args, {
                  arrayLength: totalCount,
                  sliceStart: offset,
                  resolveNode: (node) => node.artist,
                }),
              }
            }
          )
        },
      },
      artistsSearchConnection: partnerArtistsMatchConnection,
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
            artist_id?: string[]
            exclude_ids?: string[]
            for_sale: boolean
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
            missing_priority_metadata: args.missingPriorityMetadata,
            artist_id: args.artistID || undefined,
            page,
            published: args.includeUnpublished ? false : true,
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

                const totalCount = parseInt(headers["x-total-count"] || "0", 10)

                return partnerArtworksAllLoader(id, gravityArtworkArgs).then(
                  ({ body }) => {
                    return {
                      totalCount,
                      ...connectionFromArraySlice(body, args, {
                        arrayLength: totalCount,
                        sliceStart: offset,
                      }),
                    }
                  }
                )
              }
            )
          }

          return partnerArtworksLoader(id, gravityArgs).then(
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
      artworksSearchConnection: partnerArtworksMatchConnection,
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
      featuredShow: {
        type: ShowType,
        resolve: async ({ id }, _args, { partnerShowsLoader }) => {
          const { body: shows }: { body: any[] } = await partnerShowsLoader(
            id,
            {
              page: 1,
              size: 1,
              sort: "-featured,-end_at",
              displayable: true,
            }
          )

          return shows[0]
        },
      },
      filterArtworksConnection: filterArtworksConnection("partner_id"),
      vatNumber: {
        type: GraphQLString,
        resolve: ({ vat_number }) => vat_number,
      },
      hasFairPartnership: {
        type: GraphQLBoolean,
        resolve: ({ has_fair_partnership }) => has_fair_partnership,
      },
      meta: {
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "PartnerMeta",
          fields: {
            description: {
              type: GraphQLString,
              resolve: ({ bio, owner: { name }, owner_type: type }) => {
                let description = "Profile on Artsy"

                if (bio) {
                  description = bio
                } else if (isGallery(type) && name) {
                  description = `Explore Artists, Artworks, and Shows from ${name} on Artsy`
                } else if (name) {
                  description = `${name} on Artsy`
                }

                return truncate(description, 157)
              },
            },
            title: {
              type: GraphQLString,
              resolve: ({ owner: { name }, owner_type: type }) => {
                return compact([
                  name ? name : "Profile",
                  partnerTitleContent(type),
                  "Artsy",
                ]).join(" | ")
              },
            },
            image: {
              type: GraphQLString,
              resolve: ({ icon }) => {
                if (!icon) {
                  return null
                }

                return setVersion(icon, ["square140"])
              },
            },
          },
        }),
        resolve: (partner, _options, { profileLoader }) =>
          profileLoader(partner.default_profile_id).catch(() => ({
            owner: partner,
          })),
      },
      href: {
        type: GraphQLString,
        resolve: ({ type, default_profile_id, id }) =>
          type === "Auction"
            ? `/auction/${default_profile_id}`
            : `/partner/${id}`,
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
      claimed: {
        type: GraphQLBoolean,
        resolve: ({ claimed }) => claimed,
      },
      showPromoted: {
        type: GraphQLBoolean,
        resolve: ({ show_promoted }) => show_promoted,
      },
      partnerPageEligible: {
        type: GraphQLBoolean,
        resolve: ({ type }) =>
          ["Gallery", "Institution", "Institutional Seller", "Brand"].includes(
            type
          ),
      },
      fullProfileEligible: {
        deprecationReason: "Prefer displayFullPartnerPage",
        type: GraphQLBoolean,
        resolve: ({ display_full_partner_page }) => display_full_partner_page,
      },
      displayFullPartnerPage: {
        type: GraphQLBoolean,
        resolve: ({ display_full_partner_page }) => display_full_partner_page,
      },
      partnerType: {
        type: GraphQLString,
        resolve: ({ type }) => type,
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
      distinguishRepresentedArtists: {
        type: GraphQLBoolean,
        resolve: ({ distinguish_represented_artists }) =>
          distinguish_represented_artists,
      },
      displayArtistsSection: {
        type: GraphQLBoolean,
        resolve: ({ display_artists_section }) => display_artists_section,
      },
      displayWorksSection: {
        type: GraphQLBoolean,
        resolve: ({ display_works_section }) => display_works_section,
      },
      profileBannerDisplay: {
        type: GraphQLString,
        resolve: ({ profile_banner_display }) => profile_banner_display,
      },
      profileArtistsLayout: {
        type: GraphQLString,
        resolve: ({ profile_artists_layout }) => profile_artists_layout,
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
          page: {
            type: GraphQLInt,
          },
          status: {
            type: EventStatus.type,
            defaultValue: "current",
            description: "Filter shows by chronological event status",
          },
          isDisplayable: {
            type: GraphQLBoolean,
            description: "If True returns only displayable items",
          },
          artistID: {
            type: GraphQLString,
            description: "If present only return shows including the artist",
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
            displayable: boolean
            artist_id: string
          }

          const gravityArgs: GravityArgs = {
            at_a_fair: args.atAFair,
            total_count: true,
            page,
            size,
            sort: args.sort,
            status: args.status || undefined,
            day_threshold: args.dayThreshold,
            displayable: args.isDisplayable,
            artist_id: args.artistID || undefined,
          }

          return partnerShowsLoader(id, gravityArgs).then(
            ({ body, headers }) => {
              const totalCount = parseInt(headers["x-total-count"] || "0", 10)

              return {
                totalCount,
                pageCursors: createPageCursors(
                  { ...args, page, size },
                  totalCount
                ),
                ...connectionFromArraySlice(body, args, {
                  arrayLength: totalCount,
                  sliceStart: offset,
                }),
              }
            }
          )
        },
      },
      showsSearchConnection: partnerShowsMatchConnection,
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
      inquiryRequest: {
        type: InquiryRequestType,
        args: {
          inquiryId: {
            type: new GraphQLNonNull(GraphQLString),
            description: "The inquiry id",
          },
        },
        description: "Inquiry Request details",
        resolve: (
          { id },
          { inquiryId },
          { partnerInquirerCollectorProfileLoader }
        ) => {
          if (!partnerInquirerCollectorProfileLoader) return

          return partnerInquirerCollectorProfileLoader({
            partnerId: id,
            inquiryId,
          }).then((collectorProfile) => collectorProfile)
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
