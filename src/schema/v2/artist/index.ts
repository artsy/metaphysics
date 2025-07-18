import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { totalViaLoader } from "lib/total"
import { compact, defaults, first, flatten, includes, merge } from "lodash"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import Article, { articleConnection } from "schema/v2/article"
import { ArtworkType, artworkConnection } from "schema/v2/artwork"
import {
  auctionResultConnection,
  AuctionResultSorts,
  AuctionResultsState,
} from "schema/v2/auction_result"
import cached from "schema/v2/fields/cached"
import { date } from "schema/v2/fields/date"
import initials from "schema/v2/fields/initials"
import { formatMarkdownValue, markdown } from "schema/v2/fields/markdown"
import numeral from "schema/v2/fields/numeral"
import {
  connectionWithCursorInfo,
  createPageCursors,
  paginationResolver,
} from "schema/v2/fields/pagination"
import Image, { getDefault } from "schema/v2/image"
import { setVersion } from "schema/v2/image/normalize"
import { SlugAndInternalIDFields } from "schema/v2/object_identification"
import PartnerArtist, {
  partnersForArtist,
} from "schema/v2/partner/partner_artist"
import Sale from "schema/v2/sale/index"
import SaleSorts from "schema/v2/sale/sorts"
import Show from "schema/v2/show"
import ArticleSorts from "schema/v2/sorts/article_sorts"
import ArtworkSorts from "schema/v2/sorts/artwork_sorts"
import { ResolverContext } from "types/graphql"
import ArtworkSizes from "../artwork/artworkSizes"
import { GeneType } from "../gene"
import { PartnerType } from "schema/v2/partner/partner"
import ArtistArtworksFilters from "./artwork_filters"
import ArtistCarousel from "./carousel"
import { CurrentEvent } from "./current"
import ArtistHighlights from "./highlights"
import { ArtistInsights } from "./insights"
import Meta from "./meta"
import { Related } from "./related"
import {
  ShowsConnectionField,
  showsWithDenyListedPartnersRemoved,
} from "./shows"
import ArtistStatuses from "./statuses"
import { ArtistTargetSupply } from "./targetSupply"
import VerifiedRepresentatives from "./verifiedRepresentatives"
import { AuctionResultsAggregation } from "../aggregations/filterAuctionResultsAggregation"
import { parsePriceRangeValues } from "lib/moneyHelper"
import { ArtistGroupIndicatorEnum } from "schema/v2/artist/groupIndicator"
import CareerHighlights from "./careerHighlights"
import {
  MarketingCollections,
  fetchMarketingCollections,
} from "../marketingCollections"
import { ArtistSeriesConnectionType } from "../artistSeries"
import { SEO_EXPERIMENT_ARTISTS } from "schema/v2/seoExperimentArtists"
import config from "config"

// Manually curated list of artist id's who has verified auction lots that can be
// returned, when queried for via `recordsTrusted: true`.
const auctionRecordsTrusted = require("lib/auction_records_trusted.json")
  .artists

export const artistArtworkArrayLength = (artist, filter) => {
  let length
  if (first(filter) === "for_sale") {
    length = artist.forsale_artworks_count
  } else if (first(filter) === "not_for_sale") {
    length = artist.published_artworks_count - artist.forsale_artworks_count
  } else {
    length = artist.published_artworks_count
  }
  return length
}

export const ArtistType = new GraphQLObjectType<any, ResolverContext>({
  name: "Artist",
  interfaces: () => {
    const {
      EntityWithFilterArtworksConnectionInterface,
    } = require("../filterArtworksConnection")
    const { Searchable } = require("schema/v2/searchable")
    const { NodeInterface } = require("schema/v2/object_identification")
    return [
      NodeInterface,
      Searchable,
      EntityWithFilterArtworksConnectionInterface,
    ]
  },
  fields: () => {
    const {
      PartnerArtistConnection,
    } = require("schema/v2/partner/partnerArtistConnection")
    const {
      filterArtworksConnectionWithParams,
    } = require("../filterArtworksConnection")
    return {
      ...SlugAndInternalIDFields,
      cached,
      alternateNames: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ alternate_names }) => alternate_names,
      },
      articlesConnection: {
        args: pageable({
          sort: ArticleSorts,
          limit: {
            type: GraphQLInt,
            description: "DEPRECATION REASON: Use `size` instead",
          },
          inEditorialFeed: {
            type: GraphQLBoolean,
            defaultValue: false,
            description:
              "Get only articles with 'standard', 'feature', 'series' or 'video' layouts.",
          },
          page: { type: GraphQLInt },
          size: { type: GraphQLInt },
        }),
        type: articleConnection.connectionType,
        resolve: async ({ _id }, args, { articlesLoader }) => {
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const { results: body, count: totalCount } = await articlesLoader({
            count: true,
            published: true,
            artist_id: _id,
            in_editorial_feed: args.inEditorialFeed,
            limit: size,
            offset,
            sort: args.sort,
          })

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
      artistSeriesConnection: {
        type: ArtistSeriesConnectionType,
        args: pageable(),
        resolve: async ({ _id }, args, { artistSeriesListLoader }) => {
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const { body, headers } = await artistSeriesListLoader({
            artist_id: _id,
            page,
            size,
            exclude_ids: args.excludeIDs,
            total_count: true,
          })

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

      artworksConnection: {
        type: artworkConnection.connectionType,
        args: pageable({
          exclude: {
            type: new GraphQLList(GraphQLString),
            description: "List of artwork IDs to exclude from the response.",
          },
          filter: {
            type: new GraphQLList(ArtistArtworksFilters),
          },
          published: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
          sort: ArtworkSorts,
        }),
        resolve: (artist, options, { artistArtworksLoader }) => {
          // Convert `after` cursors to page params
          const { limit: size, offset } = getPagingParameters(options)
          // Construct an object of all the params gravity will listen to
          const { sort, filter, published } = options

          interface GravityArgs {
            exclude_ids?: string[]
            filter: string
            offset: number
            published: boolean
            size: number
            sort: string
          }
          const gravityArgs: GravityArgs = {
            size,
            offset,
            sort,
            filter,
            published,
          }

          if (options.exclude) {
            gravityArgs.exclude_ids = flatten([options.exclude])
          }

          return artistArtworksLoader(artist.id, gravityArgs).then((artworks) =>
            connectionFromArraySlice(artworks, options, {
              arrayLength: artistArtworkArrayLength(artist, filter),
              sliceStart: offset,
            })
          )
        },
      },
      awards: {
        type: GraphQLString,
        resolve: ({ awards }) => awards || "",
      },
      auctionResultsConnection: {
        type: auctionResultConnection.connectionType,
        args: pageable({
          allowEmptyCreatedDates: {
            type: GraphQLBoolean,
            defaultValue: true,
            description: "Allow auction results with empty created date values",
          },
          categories: {
            type: new GraphQLList(GraphQLString),
            description: "Filter auction results by category (medium)",
          },
          earliestCreatedYear: {
            type: GraphQLInt,
            description: "Filter auction results by earliest created at year",
          },
          keyword: {
            type: GraphQLString,
            description:
              "Filter by artwork title or description keyword search",
          },
          latestCreatedYear: {
            type: GraphQLInt,
            description: "Filter auction results by latest created at year",
          },
          organizations: {
            type: new GraphQLList(GraphQLString),
            description: "Filter auction results by organizations",
          },
          recordsTrusted: {
            type: GraphQLBoolean,
            defaultValue: false,
            description:
              "When true, will only return records for allowed artists.",
          },
          sizes: {
            type: new GraphQLList(ArtworkSizes),
            description: "Filter auction results by Artwork sizes",
          },
          priceRange: {
            type: GraphQLString,
            description: "Filter auction results by price",
          },
          aggregations: {
            type: new GraphQLList(AuctionResultsAggregation),
            description: "List of aggregations for auction results",
          },
          includeEstimateRange: {
            type: GraphQLBoolean,
            defaultValue: false,
            description:
              "Includes auction results with suitable estimate ranges",
          },
          includeUnknownPrices: {
            type: GraphQLBoolean,
            defaultValue: true,
            description: "Includes auction results without price",
          },
          currency: {
            type: GraphQLString,
            description: "Currency code",
          },
          saleStartYear: {
            type: GraphQLInt,
            description: "Filter auction results by start sale end date",
          },
          saleEndYear: {
            type: GraphQLInt,
            description: "Filter auction results by end sale date year",
          },
          allowUnspecifiedSaleDates: {
            type: GraphQLBoolean,
            defaultValue: true,
            description:
              "Include auction results with unspecified created dates",
          },
          sort: AuctionResultSorts,
          state: AuctionResultsState,
          page: { type: GraphQLInt },
          size: { type: GraphQLInt },
        }),
        resolve: async (
          { _id },
          options,
          { auctionLotsLoader, auctionResultFilterLoader }
        ) => {
          if (options.recordsTrusted && !includes(auctionRecordsTrusted, _id)) {
            return null
          }

          const {
            categories,
            offset,
            organizations,
            page,
            size,
            sizes,
          } = convertConnectionArgsToGravityArgs(options)

          const [min, max] = parsePriceRangeValues(options.priceRange)

          const diffusionArgs = {
            allow_empty_created_dates: options.allowEmptyCreatedDates,
            artist_id: _id,
            categories,
            currency: options.currency,
            earliest_created_year: options.earliestCreatedYear,
            keyword: options.keyword,
            latest_created_year: options.latestCreatedYear,
            min_realized_price: min,
            max_realized_price: max,
            include_estimate_range: options.includeEstimateRange,
            allow_unspecified_prices: options.includeUnknownPrices,
            organizations,
            page,
            size,
            sizes,
            sort: options.sort,
            state: options.state,
            allow_unspecified_sale_dates: options.allowUnspecifiedSaleDates,
            ...(options.saleStartYear && {
              sale_start_year: options.saleStartYear,
            }),
            ...(options.saleEndYear && { sale_end_year: options.saleEndYear }),
          }

          const requests = [auctionLotsLoader(diffusionArgs)]
          if (options.aggregations) {
            requests.push(
              auctionResultFilterLoader({
                artist_id: _id,
                aggregations: options.aggregations,
              })
            )
          }

          const [{ total_count, _embedded }, aggregations] = await Promise.all(
            requests
          )

          const totalPages = Math.ceil(total_count / size)
          return merge(
            {
              pageCursors: createPageCursors(
                {
                  page,
                  size,
                },
                total_count,
                5,
                null
              ),
            },
            {
              totalCount: total_count,
              aggregations,
            },
            connectionFromArraySlice(_embedded.items, options, {
              arrayLength: total_count,
              sliceStart: offset,
            }),
            {
              pageInfo: {
                hasPreviousPage: page > 1,
                hasNextPage: page < totalPages,
              },
            },
            {
              artist_id: _id,
            }
          )
        },
      },
      basedOn: {
        type: ArtistType,
        description:
          "In applicable contexts, this is what the artist (as a suggestion) is based on.",
      },
      bio: {
        type: GraphQLString,
        resolve: ({ nationality, years, hometown, location }) => {
          return compact([
            nationality,
            years,
            hometown,
            location ? `based in ${location}` : undefined,
          ]).join(", ")
        },
      },
      biography: {
        type: Article.type,
        description: "The Artist biography article written by Artsy",
        resolve: ({ _id }, _options, { articlesLoader }) =>
          articlesLoader({
            published: true,
            biography_for_artist_id: _id,
            limit: 1,
          }).then((articles) => first(articles.results)),
      },
      biographyBlurb: {
        args: {
          partnerBio: {
            type: GraphQLBoolean,
            description:
              "DEPRECATED: Artsy bios are always returned over featured bios.",
            defaultValue: true,
          },
          ...markdown().args,
        },
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "ArtistBlurb",
          fields: {
            credit: {
              type: GraphQLString,
              resolve: ({ credit }) => credit,
            },
            text: {
              type: GraphQLString,
              resolve: ({ text }) => text,
            },
            partnerID: {
              type: GraphQLString,
              resolve: ({ partner_id }) => partner_id,
              deprecationReason:
                "No longer used as the partner field contains the partner.id",
              description:
                "The partner id of the partner who submitted the featured bio.",
            },
            partner: {
              type: PartnerType,
              resolve: ({ partner }) => partner,
            },
          },
        }),
        resolve: async (
          { blurb, id },
          { format },
          { partnerArtistsForArtistLoader }
        ) => {
          // Return the Artsy bio if one exists
          if (blurb && blurb.length) {
            return { text: formatMarkdownValue(blurb, format) }
          }

          const partnerArtists = await partnerArtistsForArtistLoader(id, {
            size: 1,
            featured: true,
          })

          if (partnerArtists && partnerArtists.length) {
            const { biography, partner } = first(partnerArtists) as any

            // Return the featured partner bio if one exists
            if (biography && biography.length) {
              const credit = `_Submitted by [${partner.name}](${config.FORCE_URL}/partner/${partner.id})_`

              return {
                text: formatMarkdownValue(biography, format),
                credit: formatMarkdownValue(credit, format),
                partner_id: partner.id,
                partner: partner,
              }
            }
          }

          // Return nothing if neither an Artsy nor a partner bio exists
          return null
        },
      },
      birthday: { type: GraphQLString },
      biennials: {
        type: GraphQLString,
        description: "The biennials the artist has participated in",
        resolve: ({ biennials }) => biennials,
      },
      blurb: {
        args: markdown().args,
        type: GraphQLString,
        resolve: ({ blurb }, { format }) => {
          if (blurb.length) {
            return formatMarkdownValue(blurb, format)
          }
        },
      },
      carousel: ArtistCarousel,
      collections: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ collections }) => {
          if (!collections) {
            return null
          }
          return collections.split("\n")
        },
      },
      contemporary: {
        type: new GraphQLList(Artist.type),
        args: {
          size: {
            type: GraphQLInt,
            description: "The number of Artists to return",
          },
          excludeArtistsWithoutArtworks: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
        },
        resolve: (
          { id },
          { excludeArtistsWithoutArtworks, ..._options },
          { relatedContemporaryArtistsLoader }
        ) => {
          const options: any = {
            exclude_artists_without_artworks: excludeArtistsWithoutArtworks,
            ..._options,
          }
          return relatedContemporaryArtistsLoader(
            defaults(options, {
              artist: [id],
            })
          ).then(({ body }) => body)
        },
      },
      counts: {
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "ArtistCounts",
          fields: {
            artworks: numeral(
              ({ published_artworks_count }) => published_artworks_count
            ),
            follows: numeral(({ follow_count }) => follow_count),
            forSaleArtworks: numeral(
              ({ forsale_artworks_count }) => forsale_artworks_count
            ),
            partnerShows: numeral(
              ({ partner_shows_count }) => partner_shows_count
            ),
            relatedArtists: {
              type: GraphQLInt,
              resolve: ({ id }, _options, { relatedMainArtistsLoader }) => {
                return totalViaLoader(
                  relatedMainArtistsLoader,
                  {},
                  {
                    artist: [id],
                  }
                )
              },
            },
            articles: {
              type: GraphQLInt,
              resolve: ({ _id }, _options, { articlesLoader }) =>
                articlesLoader({
                  artist_id: _id,
                  published: true,
                  limit: 0,
                  count: true,
                }).then(({ count }) => count),
            },
            ecommerceArtworks: numeral(
              ({ ecommerce_artworks_count }) => ecommerce_artworks_count
            ),
            hasMakeOfferArtworks: {
              type: GraphQLBoolean,
              resolve: ({ has_make_offer_artworks }) => has_make_offer_artworks,
            },
            auctionArtworks: numeral(
              ({ auction_artworks_count }) => auction_artworks_count
            ),
            auctionResults: {
              type: GraphQLInt,
              deprecationReason: "Favor `statuses#auctionLots`",
              resolve: ({ _id }, _options, { auctionLotsLoader }) =>
                auctionLotsLoader({
                  artist_id: _id,
                }).then(({ total_count }) => {
                  return total_count
                }),
            },
            duplicates: {
              type: GraphQLInt,
              resolve: async ({ id }, _args, { artistDuplicatesLoader }) => {
                if (!artistDuplicatesLoader) {
                  throw new Error(
                    "You need to be signed in to perform this action"
                  )
                }
                const { headers } = await artistDuplicatesLoader(id)
                return headers["x-total-count"] || 0
              },
            },
            myCollectedArtworks: {
              type: new GraphQLNonNull(GraphQLInt),
              resolve: async ({ _id }, _, { meMyCollectionArtworksLoader }) => {
                if (!meMyCollectionArtworksLoader) {
                  return 0
                }

                const { headers } = await meMyCollectionArtworksLoader({
                  total_count: true,
                  artist_ids: [_id],
                  exclude_purchased_artworks: false,
                })

                const totalCount = parseInt(headers["x-total-count"] || "0", 10)

                return totalCount
              },
            },
          },
        }),
        resolve: (artist) => artist,
      },
      coverArtwork: {
        type: ArtworkType,
        resolve: async (
          { id, cover_artwork_id },
          _options,
          { artistArtworksLoader, unauthenticatedLoaders: { artworkLoader } }
        ) => {
          const staticArtworkID = `${id}-coverArtwork`

          if (cover_artwork_id) {
            try {
              const artwork = await artworkLoader(cover_artwork_id)
              return {
                ...artwork,
                _id: staticArtworkID,
              }
            } catch {
              // Intentionally ignore errors from unpublished/deleted artworks
              // that are set as cover artworks.
            }
          }

          const [fallbackArtwork] = await artistArtworksLoader(id, {
            offset: 0,
            size: 1,
            sort: "-iconicity",
            published: true,
          })

          return {
            ...fallbackArtwork,
            _id: staticArtworkID,
          }
        },
      },
      createdAt: date(),
      criticallyAcclaimed: {
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve: ({ critically_acclaimed }) => !!critically_acclaimed,
      },
      currentEvent: CurrentEvent,
      deathday: { type: GraphQLString },
      disablePriceContext: {
        type: GraphQLBoolean,
        resolve: ({ disable_price_context }) => disable_price_context,
      },
      exhibitionHighlights: {
        args: {
          size: {
            type: GraphQLInt,
            description: "The number of Shows to return",
            defaultValue: 5,
          },
        },
        type: new GraphQLList(Show.type),
        description:
          "Custom-sorted list of shows for an artist, in order of significance.",
        resolve: ({ id }, options, { relatedShowsLoader }) => {
          return relatedShowsLoader({
            artist_id: id,
            sort: "-relevance,-start_at",
            is_reference: true,
            visible_to_public: false,
            has_location: true,
            size: options.size,
          }).then(({ body: shows }) =>
            showsWithDenyListedPartnersRemoved(shows)
          )
        },
      },
      filterArtworksConnection: filterArtworksConnectionWithParams(
        ({ _id }) => ({
          artist_id: _id,
        })
      ),
      formattedArtworksCount: {
        type: GraphQLString,
        description:
          "A string showing the total number of works and those for sale",
        resolve: ({ published_artworks_count, forsale_artworks_count }) => {
          let totalWorks: string | null = null
          if (published_artworks_count) {
            totalWorks =
              published_artworks_count +
              (published_artworks_count > 1 ? " works" : " work")
          }
          const forSaleWorks = forsale_artworks_count
            ? forsale_artworks_count + " for sale"
            : null
          return forSaleWorks && totalWorks
            ? totalWorks + ", " + forSaleWorks
            : totalWorks
        },
      },
      formattedNationalityAndBirthday: {
        type: GraphQLString,
        description: `A string of the form "Nationality, Birthday (or Birthday-Deathday)"`,
        resolve: ({ birthday, nationality, deathday }) => {
          let formatted_bday =
            !isNaN(birthday) && birthday ? "b. " + birthday : birthday
          formatted_bday =
            formatted_bday && formatted_bday.replace(/born/i, "b.")

          if (!isNaN(deathday) && deathday && formatted_bday) {
            formatted_bday = `${formatted_bday.replace(
              "b. ",
              ""
            )}–${deathday.match(/\d+/)}`
          }
          if (nationality && formatted_bday) {
            return nationality + ", " + formatted_bday
          }
          return nationality || formatted_bday
        },
      },
      genes: {
        description: `A list of genes associated with an artist`,
        type: new GraphQLList(GeneType),
        resolve: ({ id }, _options, { artistGenesLoader }) => {
          return artistGenesLoader(id).then((genes) => genes)
        },
      },
      gender: { type: GraphQLString },
      groupIndicator: {
        type: ArtistGroupIndicatorEnum,
        resolve: ({ group_indicator }) => group_indicator,
      },
      hasMetadata: {
        type: GraphQLBoolean,
        resolve: ({ blurb, nationality, years, hometown, location }) => {
          return !!(blurb || nationality || years || hometown || location)
        },
      },
      highlights: ArtistHighlights,
      hometown: { type: GraphQLString },
      href: {
        type: GraphQLString,
        resolve: (artist) => `/artist/${artist.id}`,
      },
      image: Image,
      imageUrl: {
        type: GraphQLString,
        resolve: ({ image_versions, image_url, image_urls }) =>
          setVersion(
            getDefault({
              image_url: image_url,
              images_urls: image_urls,
              image_versions: image_versions,
            }),
            ["square"]
          ),
      },
      initials: initials("name"),
      insights: ArtistInsights,
      isConsignable: {
        type: GraphQLBoolean,
        resolve: ({ consignable }) => consignable,
      },
      isDisplayAuctionLink: {
        type: GraphQLBoolean,
        description:
          "Only specific Artists should show a link to auction results.",
        resolve: ({ display_auction_link }) => display_auction_link,
      },
      isFollowed: {
        type: GraphQLBoolean,
        resolve: ({ id }, _args, { followedArtistLoader }) => {
          if (!followedArtistLoader) return false
          return followedArtistLoader(id).then(({ is_followed }) => is_followed)
        },
      },
      isInSeoExperiment: {
        type: GraphQLBoolean,
        description: "Temporary field to test SEO experiment",
        resolve: ({ id }) => {
          return SEO_EXPERIMENT_ARTISTS.includes(id)
        },
      },
      isPersonalArtist: {
        type: GraphQLBoolean,
        description: "Whether the artist has been created by a user.",
        resolve: ({ is_personal_artist }) => is_personal_artist,
      },
      isPublic: {
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve: (artist) => !!artist.public,
      },
      isShareable: {
        type: GraphQLBoolean,
        resolve: (artist) => artist.published_artworks_count > 0,
      },
      displayLabel: { type: GraphQLString, resolve: ({ name }) => name },
      location: { type: GraphQLString },
      meta: Meta,
      marketingCollections: {
        type: MarketingCollections.type,
        args: pageable({
          category: {
            type: GraphQLString,
          },
          isFeaturedArtistContent: {
            type: GraphQLBoolean,
          },
          slugs: {
            type: new GraphQLList(GraphQLNonNull(GraphQLString)),
          },
          size: {
            type: GraphQLInt,
          },
        }),
        resolve: (artist, _args, { marketingCollectionsLoader }) => {
          const args = {
            artist_id: artist._id,
            ..._args,
          }
          return fetchMarketingCollections(args, marketingCollectionsLoader)
        },
      },
      nationality: { type: GraphQLString },
      name: { type: GraphQLString },
      first: { type: GraphQLString },
      foundations: {
        type: GraphQLString,
        resolve: ({ foundations }) => foundations,
      },
      last: { type: GraphQLString },
      displayName: {
        type: GraphQLString,
        resolve: ({ display_name }) => display_name,
      },
      middle: { type: GraphQLString },
      partnersConnection: {
        type: PartnerArtistConnection,
        args: pageable({
          representedBy: {
            type: GraphQLBoolean,
          },
          partnerCategory: {
            type: new GraphQLList(GraphQLString),
          },
        }),
        resolve: (
          { id: artist_id },
          { representedBy, partnerCategory },
          { partnerArtistsLoader }
        ) => {
          const options: any = {
            represented_by: representedBy,
            partner_category: partnerCategory,
          }
          return partnersForArtist(artist_id, options, partnerArtistsLoader)
        },
      },
      partnerArtists: {
        type: new GraphQLList(PartnerArtist.type),
        args: {
          size: {
            type: GraphQLInt,
            description: "The number of PartnerArtists to return",
          },
        },
        resolve: ({ id }, options, { partnerArtistsForArtistLoader }) =>
          partnerArtistsForArtistLoader(id, options),
      },
      partnerBiographyBlurb: {
        description: "The Partner's provided biography for the artist",
        deprecationReason: "This field is deprecated. No longer in use",
        args: {
          ...markdown().args,
        },
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "partnerBiographyBlurb",
          fields: {
            text: {
              type: GraphQLString,
              resolve: ({ text }) => text,
            },
          },
        }),
        resolve: async (
          { id },
          { format },
          { partnerArtistsForArtistLoader }
        ) => {
          const partnerArtists = await partnerArtistsForArtistLoader(id, {
            size: 1,
          })

          if (partnerArtists && partnerArtists.length) {
            const { biography } = first(partnerArtists) as any

            return {
              text: formatMarkdownValue(biography, format),
            }
          }
        },
      },
      duplicates: {
        type: new GraphQLList(Artist.type),
        resolve: ({ id }, _args, { artistDuplicatesLoader }, _info) => {
          if (!artistDuplicatesLoader) {
            throw new Error("You need to be signed in to perform this action")
          }
          return artistDuplicatesLoader(id).then(({ body: dupes }) => dupes)
        },
      },
      related: Related,
      recentShow: {
        type: GraphQLString,
        description: "The most recent show for an artist",
        resolve: ({ recent_show }) => recent_show,
      },
      reviewSources: {
        type: GraphQLString,
        description: "publications that have reviewed the artist",
        resolve: ({ review_sources }) => review_sources,
      },
      sales: {
        type: new GraphQLList(Sale.type),
        args: {
          live: { type: GraphQLBoolean },
          isAuction: { type: GraphQLBoolean },
          size: {
            type: GraphQLInt,
            description: "The number of Sales to return",
          },
          sort: SaleSorts,
        },
        resolve: (
          { id },
          { isAuction, ..._options },
          { relatedSalesLoader }
        ) => {
          const options: any = {
            is_auction: isAuction,
            ..._options,
          }
          return relatedSalesLoader(
            defaults(options, {
              artist_id: id,
              sort: "timely_at,name",
            })
          )
        },
      },
      showsConnection: ShowsConnectionField,
      sortableID: {
        type: GraphQLString,
        description:
          "Use this attribute to sort by when sorting a collection of Artists",
        resolve: ({ sortable_id }) => sortable_id,
      },
      statuses: ArtistStatuses,
      targetSupply: ArtistTargetSupply,
      vanguardYear: {
        type: GraphQLString,
        resolve: ({ vanguard_year }) => vanguard_year,
      },
      verifiedRepresentatives: VerifiedRepresentatives,
      careerHighlights: CareerHighlights,
      years: { type: GraphQLString },
    }
  },
})

const Artist: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtistType,
  description: "An Artist",
  args: {
    id: {
      description: "The slug or ID of the Artist",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_root, { id }, { artistLoader }) => {
    if (id.length === 0) {
      return null
    }
    return artistLoader(id)
  },
}
export default Artist

const edgeFields = {
  artworksCount: {
    type: GraphQLInt,
    description:
      "When a relevant `artworksCount` field exists to augment a connection",
    resolve: ({ artworksCount }) => artworksCount,
  },
}

export const artistConnection = connectionWithCursorInfo({
  nodeType: ArtistType,
  edgeFields,
})
