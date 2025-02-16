import { CursorPageable, pageable } from "relay-cursor-paging"
import {
  GraphQLEnumType,
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
import cached from "schema/v2/fields/cached"
import initials from "schema/v2/fields/initials"
import Profile from "schema/v2/profile"
import { locationsConnection, LocationType } from "schema/v2/location"
import EventStatus, {
  EventStatusEnums,
} from "schema/v2/input_fields/event_status"
import {
  IDFields,
  NodeInterface,
  SlugAndInternalIDFields,
} from "schema/v2/object_identification"
import Artwork, { artworkConnection } from "schema/v2/artwork"
import numeral from "schema/v2/fields/numeral"
import { ShowsConnection, ShowType } from "schema/v2/show"
import { ArtistType } from "schema/v2/artist"
import ArtworkSorts from "schema/v2/sorts/artwork_sorts"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"
import { ResolverContext } from "types/graphql"
import { PartnerCategoryType } from "./partner_category"
import ShowSorts from "schema/v2/sorts/show_sorts"
import ArtistSorts from "schema/v2/sorts/artist_sorts"
import { fields as partnerArtistFields } from "./partner_artist"
import {
  connectionWithCursorInfo,
  createPageCursors,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { deprecate } from "lib/deprecation"
import { articleConnection } from "schema/v2/article"
import ArticleSorts, { ArticleSort } from "schema/v2/sorts/article_sorts"
import { allViaLoader } from "lib/all"
import { truncate } from "lib/helpers"
import { setVersion } from "schema/v2/image/normalize"
import { compact } from "lodash"
import { InquiryRequestType } from "./partnerInquiryRequest"
import { PartnerDocumentsConnection } from "./partnerDocumentsConnection"
import { AlertType, PartnerAlertsEdgeFields } from "../Alerts"
import {
  ArtworkVisibility,
  ArtworkVisibilityEnumValues,
} from "schema/v2/artwork/artworkVisibility"
import { date } from "../fields/date"
import config from "config"
import {
  ViewingRoomsConnection,
  ViewingRoomStatusEnum,
} from "../viewingRoomConnection"

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

const isPartnerPageEligible = ({ type }) =>
  ["Gallery", "Institution", "Institutional Seller", "Brand"].includes(type)

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
  includeUnpublished: {
    type: GraphQLBoolean,
    description:
      "If true return both published and unpublished artworks, requires auth",
  },
  missingPriorityMetadata: {
    type: GraphQLBoolean,
    description: "Return artworks that are missing priority metadata",
  },
  partnerOfferable: {
    type: GraphQLBoolean,
    description: "Only return artworks that are partner-offerable",
  },
  publishedWithin: {
    type: GraphQLInt,
    description: "Return artworks published less than x seconds ago.",
  },
  shallow: {
    type: GraphQLBoolean,
    description:
      "Only allowed for authorized admin/partner requests. When false fetch :all properties on an artwork, when true or not present fetch artwork :short properties",
  },
  visibilityLevels: {
    type: new GraphQLList(ArtworkVisibility),
    description:
      "Return artworks according to visibility levels. Defaults to ['listed'].",
  },
  sort: ArtworkSorts,
  page: { type: GraphQLInt },
}

const ArtistAlertsSort = {
  type: new GraphQLEnumType({
    name: "ArtistAlertsSort",
    values: {
      SORTABLE_ID_ASC: {
        value: "sortable_id",
      },
      SORTABLE_ID_DESC: {
        value: "-sortable_id",
      },
    },
  }),
}

export const PartnerType = new GraphQLObjectType<any, ResolverContext>({
  name: "Partner",
  interfaces: [NodeInterface],
  fields: () => {
    // These avoids a circular require
    const ArtistPartnerConnection = connectionWithCursorInfo({
      name: "ArtistPartner",
      nodeType: ArtistType,
      edgeFields: partnerArtistFields,
    }).connectionType

    const {
      filterArtworksConnection,
    } = require("schema/v2/filterArtworksConnection")

    const {
      partnerArtistsMatchConnection,
      partnerArtworksMatchConnection,
      partnerShowsMatchConnection,
    } = require("./PartnerMatch")

    const ArtistsWithAlertCountsConnectionType = connectionWithCursorInfo({
      name: "ArtistsWithAlertCounts",
      edgeFields: {
        totalAlertCount: {
          type: GraphQLInt,
          resolve: ({ total_alert_count }) => total_alert_count,
        },
      },
      nodeType: ArtistType,
    }).connectionType

    const PartnerAlertsConnectionType = connectionWithCursorInfo({
      name: "PartnerAlerts",
      edgeFields: PartnerAlertsEdgeFields,
      nodeType: AlertType,
    }).connectionType

    const PartnerAlertHitsConnection = connectionWithCursorInfo({
      name: "PartnerAlertHits",
      edgeFields: {
        ...IDFields,
        artwork: {
          type: Artwork.type,
          resolve: ({ artwork }) => artwork,
        },
        createdAt: date(),
        partnerSearchCriteriaID: {
          type: GraphQLString,
          resolve: ({ partner_search_criteria_id }) =>
            partner_search_criteria_id,
        },
        userIDs: {
          type: new GraphQLList(GraphQLString),
          resolve: ({ user_ids }) => user_ids,
        },
      },
      nodeType: AlertType,
    }).connectionType

    const {
      ArtworkImportsConnectionType,
    } = require("schema/v2/ArtworkImport/artworkImport")

    return {
      ...SlugAndInternalIDFields,
      cached,
      artistsWithAlertCountsConnection: {
        type: ArtistsWithAlertCountsConnectionType,
        args: pageable({
          page: {
            type: GraphQLInt,
          },
          size: {
            type: GraphQLInt,
          },
          sort: ArtistAlertsSort,
        }),
        resolve: async (
          { _id },
          args,
          { partnerArtistsWithAlertCountsLoader }
        ) => {
          if (!partnerArtistsWithAlertCountsLoader) return null

          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          type GravityArgs = {
            page: number
            size: number
            total_count: boolean
            sort?: string
          }

          const gravityArgs: GravityArgs = {
            page,
            size,
            total_count: true,
            sort: args.sort,
          }

          const { body, headers } = await partnerArtistsWithAlertCountsLoader?.(
            _id,
            gravityArgs
          )

          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return paginationResolver({
            totalCount,
            offset,
            page,
            size,
            body: body.hits,
            args,
            resolveNode: ({ artist }) => artist,
          })
        },
      },
      alertsConnection: {
        type: PartnerAlertsConnectionType,
        args: pageable({
          id: {
            type: GraphQLString,
          },
          page: {
            type: GraphQLInt,
          },
          size: {
            type: GraphQLInt,
          },
          artistID: {
            type: GraphQLString,
          },
        }),
        resolve: async (
          { _id },
          args,
          { partnerSearchCriteriaLoader, partnerSearchCriteriasLoader }
        ) => {
          if (!partnerSearchCriteriasLoader || !partnerSearchCriteriaLoader)
            return null

          if (args.id && !args.first) {
            args.first = 1
          }

          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          type GravityArgs = {
            page: number
            size: number
            total_count: boolean
            artist_id?: string
            id?: string
          }

          const gravityArgs: GravityArgs = {
            page,
            size,
            total_count: true,
            artist_id: args.artistID,
            id: args.id,
          }

          let body, totalCount

          if (args.id) {
            const singleResult = await partnerSearchCriteriaLoader({
              partner_id: _id,
              id: args.id,
            })

            body = singleResult ? [singleResult.body] : []
            totalCount = body.length
          } else {
            // Otherwise, use the partnerSearchCriteriasLoader list endpoint
            const response = await partnerSearchCriteriasLoader(
              _id,
              gravityArgs
            )
            body = response.body.hits
            totalCount = parseInt(response.headers["x-total-count"] || "0", 10)
          }

          return paginationResolver({
            totalCount,
            offset,
            page,
            size,
            body: body,
            args,
            resolveNode: ({ search_criteria }) => search_criteria,
          })
        },
      },
      partnerAlertHitsConnection: {
        description: "A connection of search criteria hits from a Partner.",
        type: PartnerAlertHitsConnection,
        args: pageable({
          page: {
            type: GraphQLInt,
          },
          size: {
            type: GraphQLInt,
          },
        }),
        resolve: async ({ _id }, args, { partnerSearchCriteriaHitsLoader }) => {
          if (!partnerSearchCriteriaHitsLoader) return null
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          type GravityArgs = {
            page: number
            size: number
            total_count: boolean
          }

          const gravityArgs: GravityArgs = {
            page,
            size,
            total_count: true,
          }

          const { body, headers } = await partnerSearchCriteriaHitsLoader?.(
            _id,
            gravityArgs
          )

          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return paginationResolver({
            totalCount,
            offset,
            page,
            size,
            body,
            args,
            resolveNode: ({ search_criteria }) => search_criteria,
          })
        },
      },
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
          representedByOrHasPublishedArtworks: {
            type: GraphQLBoolean,
            description:
              "Include artists that are represented or have published artworks, should not be used in conjunction with hasPublishedArtworks or representedBy.",
          },
          artistIDs: {
            type: new GraphQLList(GraphQLString),
          },
          includeAllFields: {
            type: GraphQLBoolean,
            description:
              "Include additional fields on artists, requires authentication",
          },
        }),
        resolve: async (
          { id },
          args,
          { partnerArtistsForPartnerLoader, partnerArtistsAllLoader }
        ) => {
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
            represented_by_or_has_published_artworks: boolean
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
            represented_by_or_has_published_artworks:
              args.representedByOrHasPublishedArtworks,
          }

          const partnerArtistsLoader = (() => {
            // Authenticated
            if (args.includeAllFields) {
              if (!partnerArtistsAllLoader) {
                throw new Error(
                  "You need to pass a X-Access-Token header to perform this action"
                )
              }

              return partnerArtistsAllLoader
            }

            return partnerArtistsForPartnerLoader
          })()

          const { body, headers } = await partnerArtistsLoader?.(
            id,
            gravityArgs
          )

          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return paginationResolver({
            args,
            body,
            offset,
            page,
            size,
            totalCount,
            resolveNode: (node) => node.artist,
          })
        },
      },
      artistsSearchConnection: partnerArtistsMatchConnection,
      artworksConnection: {
        description: "A connection of artworks from a Partner.",
        type: artworkConnection.connectionType,
        args: pageable(artworksArgs),
        resolve: async (
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
            partner_offerable?: boolean
            page: number
            published?: boolean
            published_within?: number
            size: number
            sort: string
            total_count: boolean
            visibility_levels: Array<"listed" | "unlisted">
          }

          const gravityArgs: GravityArgs = {
            for_sale: args.forSale,
            missing_priority_metadata: args.missingPriorityMetadata,
            artist_id: args.artistID || undefined,
            partner_offerable: args.partnerOfferable,
            page,
            published: true,
            published_within: args.publishedWithin,
            size,
            sort: args.sort,
            total_count: true,
            visibility_levels: args.visibilityLevels
              ? args.visibilityLevels
              : [ArtworkVisibilityEnumValues.LISTED],
          }

          if (args.includeUnpublished) {
            delete gravityArgs.published
          }

          if (args.exclude) {
            gravityArgs.exclude_ids = flatten([args.exclude])
          }
          if (args.artworkIDs) {
            gravityArgs.artwork_id = flatten([args.artworkIDs])
          }

          const { body, headers } = await partnerArtworksLoader(id, gravityArgs)
          const totalCount = parseInt(headers["x-total-count"] || "0", 10)
          const artworkIds = body.map((artwork) => artwork._id)

          // Only accept shallow = false argument if requesting user is authorized admin/partner
          if (
            args.shallow === false &&
            artworkIds.length > 0 &&
            partnerArtworksAllLoader
          ) {
            const gravityArtworkArgs = {
              artwork_id: artworkIds,
              sort: args.sort,
            }

            const { body: artworks } = await partnerArtworksAllLoader(
              id,
              gravityArtworkArgs
            )

            return paginationResolver({
              totalCount,
              offset,
              page,
              size,
              body: artworks,
              args,
            })
          }

          return paginationResolver({
            totalCount,
            offset,
            page,
            size,
            body,
            args,
          })
        },
      },
      artworkImportsConnection: {
        description: "A connection of artwork imports from a Partner.",
        type: ArtworkImportsConnectionType,
        args: pageable(),
        resolve: async ({ id }, args, { artworkImportsLoader }) => {
          if (!artworkImportsLoader) return null
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const { body, headers } = await artworkImportsLoader({
            page,
            size,
            total_count: true,
            partner_id: id,
          })

          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return paginationResolver({
            totalCount,
            offset,
            page,
            size,
            body,
            args,
          })
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
        resolve: async (
          { id },
          { size },
          { unauthenticatedLoaders: { partnerLocationsConnectionLoader } }
        ) => {
          const { body } = await partnerLocationsConnectionLoader(id, { size })

          const cities = (body ?? []).map((location) => location.city)

          // Filter for dupes and blanks
          return Array.from(new Set(cities)).filter(Boolean)
        },
      },
      defaultProfileID: {
        type: GraphQLString,
        resolve: ({ default_profile_id }) => default_profile_id,
      },
      documentsConnection: PartnerDocumentsConnection,
      merchantAccount: {
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "PartnerMerchantAccount",
          fields: {
            externalId: {
              type: new GraphQLNonNull(GraphQLString),
              resolve: ({ external_id }) => external_id,
            },
          },
        }),
        resolve: async ({ id }, _args, { partnerMerchantAccountsLoader }) => {
          if (!partnerMerchantAccountsLoader) {
            return null
          }
          const {
            body: accounts,
          }: { body: any[] } = await partnerMerchantAccountsLoader(
            {
              partnerId: id,
            },
            {
              page: 1,
              size: 1,
            }
          )

          return accounts[0]
        },
      },
      featuredKeywords: {
        type: new GraphQLNonNull(
          GraphQLList(new GraphQLNonNull(GraphQLString))
        ),
        description: "Suggested filters for associated artworks",
        resolve: ({ featured_keywords }) => featured_keywords ?? [],
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
              resolve: ({ owner, owner_type: type, partner }) => {
                const partnerName = owner.name || "Profile"
                const titleContent = partner.display_full_partner_page
                  ? partnerTitleContent(type)
                  : "About the Gallery and Nearby Galleries"

                return compact([partnerName, titleContent, "Artsy"]).join(" | ")
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
        resolve: async (partner, _options, { profileLoader }) => {
          try {
            const profile = await profileLoader(partner.default_profile_id)
            return { ...profile, partner }
          } catch (error) {
            return {
              owner: partner,
              partner,
            }
          }
        },
      },
      href: {
        type: GraphQLString,
        description:
          "The url for a partner. May be `null` if partner is not eligible for page.",
        resolve: (partner) =>
          isPartnerPageEligible(partner) ? `/partner/${partner.id}` : null,
      },
      initials: initials("name"),
      isDefaultProfilePublic: {
        type: GraphQLBoolean,
        resolve: ({ default_profile_public }) => default_profile_public,
      },
      isInquireable: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: "If the partner supports inquiries",
        resolve: ({ inquireable }) => inquireable,
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
        resolve: isPartnerPageEligible,
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
        resolve: async ({ id }, options, { partnerLocationsLoader }) => {
          const locations = await partnerLocationsLoader(id, options)

          return locations ?? []
        },
      },
      locationsConnection: {
        description: "A connection of locations from a Partner.",
        type: locationsConnection.connectionType,
        args: pageable({
          page: { type: GraphQLInt },
          size: { type: GraphQLInt },
          private: {
            type: GraphQLBoolean,
            description: "Return all partner-authenticated locations.",
          },
          addressType: {
            type: new GraphQLEnumType({
              name: "addressType",
              values: {
                BUSINESS: { value: "Business" },
                TEMPORARY: { value: "Temporary" },
                OTHER: { value: "Other" },
              },
            }),
          },
        }),
        resolve: async (
          { id },
          args,
          { authenticatedLoaders, unauthenticatedLoaders }
        ) => {
          const partnerLocationsConnectionLoader = args.private
            ? authenticatedLoaders.partnerLocationsConnectionLoader
            : unauthenticatedLoaders.partnerLocationsConnectionLoader

          if (!partnerLocationsConnectionLoader) {
            throw new Error(
              "You need to pass a X-Access-Token header to perform this action"
            )
          }

          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const { body, headers } = await partnerLocationsConnectionLoader(id, {
            private: args.private,
            address_type: args.addressType,
            total_count: true,
            offset,
            size,
          })
          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return paginationResolver({
            totalCount,
            offset,
            page,
            size,
            body,
            args,
          })
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
            defaultValue: EventStatusEnums.getValue("CURRENT")?.value,
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
        resolve: async (
          { id: partnerId },
          { inquiryId },
          { partnerInquiryRequestLoader }
        ) => {
          if (!partnerInquiryRequestLoader) {
            return null
          }

          const response = await partnerInquiryRequestLoader({
            partnerId,
            inquiryId,
          })

          return {
            partnerId,
            ...response,
          }
        },
      },
      ...(config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA && {
        viewingRoomsConnection: {
          type: ViewingRoomsConnection.type,
          args: pageable({
            statuses: {
              type: new GraphQLList(new GraphQLNonNull(ViewingRoomStatusEnum)),
            },
          }),
          resolve: async ({ _id: partnerID }, args, { viewingRoomsLoader }) => {
            const { page, size, offset } = convertConnectionArgsToGravityArgs(
              args
            )

            const gravityArgs = {
              partner_id: partnerID,
              statuses: args.statuses,
              page,
              size,
              total_count: true,
            }

            const { body, headers } = await viewingRoomsLoader(gravityArgs)

            const totalCount = parseInt(headers["x-total-count"] || "0", 10)

            return paginationResolver({
              args,
              body,
              offset,
              page,
              size,
              totalCount,
            })
          },
        },
      }),
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
