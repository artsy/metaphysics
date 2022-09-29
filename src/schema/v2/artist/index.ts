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
import {
  compact,
  defaults,
  first,
  flatten,
  includes,
  merge,
  omit,
} from "lodash"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import Article, { articleConnection } from "schema/v2/article"
import { artworkConnection } from "schema/v2/artwork"
import {
  auctionResultConnection,
  AuctionResultSorts,
} from "schema/v2/auction_result"
import cached from "schema/v2/fields/cached"
import { date } from "schema/v2/fields/date"
import initials from "schema/v2/fields/initials"
import { formatMarkdownValue, markdown } from "schema/v2/fields/markdown"
import numeral from "schema/v2/fields/numeral"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "schema/v2/fields/pagination"
import Image, { getDefault } from "schema/v2/image"
import { setVersion } from "schema/v2/image/normalize"
import { SlugAndInternalIDFields } from "schema/v2/object_identification"
import PartnerArtist, { partnersForArtist } from "schema/v2/partner_artist"
import Sale from "schema/v2/sale/index"
import SaleSorts from "schema/v2/sale/sorts"
import Show from "schema/v2/show"
import ArticleSorts from "schema/v2/sorts/article_sorts"
import ArtworkSorts from "schema/v2/sorts/artwork_sorts"
import { ResolverContext } from "types/graphql"
import ArtworkSizes from "../artwork/artworkSizes"
import { GeneType } from "../gene"
import { PartnerType } from "../partner"
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
    } = require("schema/v2/partnerArtistConnection")
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
          },
          inEditorialFeed: {
            type: GraphQLBoolean,
            description:
              "Get only articles with 'standard', 'feature', 'series' or 'video' layouts.",
          },
        }),
        type: articleConnection.connectionType,
        resolve: (
          { _id },
          { inEditorialFeed, ..._args },
          { articlesLoader }
        ) => {
          const args: any = {
            in_editorial_feed: inEditorialFeed,
            ..._args,
          }
          const pageOptions = convertConnectionArgsToGravityArgs(args)
          const { page, size, offset } = pageOptions

          const gravityArgs = omit(args, ["first", "after", "last", "before"])
          return articlesLoader(
            defaults(gravityArgs, pageOptions, {
              artist_id: _id,
              published: true,
              count: true,
            })
          ).then(({ results, count }) => {
            const totalPages = Math.ceil(count / size)
            return merge(
              { pageCursors: createPageCursors(pageOptions, count) },
              connectionFromArraySlice(results, args, {
                arrayLength: count,
                sliceStart: offset,
              }),
              {
                pageInfo: {
                  hasPreviousPage: page > 1,
                  hasNextPage: page < totalPages,
                },
              }
            )
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
      auctionResultsConnection: {
        type: auctionResultConnection.connectionType,
        args: pageable({
          sort: AuctionResultSorts,
          organizations: {
            type: new GraphQLList(GraphQLString),
            description: "Filter auction results by organizations",
          },
          sizes: {
            type: new GraphQLList(ArtworkSizes),
            description: "Filter auction results by Artwork sizes",
          },
          categories: {
            type: new GraphQLList(GraphQLString),
            description: "Filter auction results by category (medium)",
          },
          recordsTrusted: {
            type: GraphQLBoolean,
            defaultValue: false,
            description:
              "When true, will only return records for allowed artists.",
          },
          earliestCreatedYear: {
            type: GraphQLInt,
            description: "Filter auction results by earliest created at year",
          },
          latestCreatedYear: {
            type: GraphQLInt,
            description: "Filter auction results by latest created at year",
          },
          allowEmptyCreatedDates: {
            type: GraphQLBoolean,
            defaultValue: true,
            description:
              "Filter auction results by empty artwork created date values",
          },
          keyword: {
            type: GraphQLString,
            description:
              "Filter by artwork title or description keyword search",
          },
        }),
        resolve: async ({ _id }, options, { auctionLotsLoader }) => {
          if (options.recordsTrusted && !includes(auctionRecordsTrusted, _id)) {
            return null
          }

          // Convert `after` cursors to page params
          const {
            page,
            size,
            offset,
            sizes,
            organizations,
            categories,
          } = convertConnectionArgsToGravityArgs(options)
          const diffusionArgs = {
            page,
            size,
            artist_id: _id,
            organizations,
            categories,
            keyword: options.keyword,
            earliest_created_year: options.earliestCreatedYear,
            latest_created_year: options.latestCreatedYear,
            allow_empty_created_dates: options.allowEmptyCreatedDates,
            sizes,
            sort: options.sort,
          }

          return auctionLotsLoader(diffusionArgs).then(
            ({ total_count, _embedded }) => {
              const totalPages = Math.ceil(total_count / size)
              return merge(
                {
                  pageCursors: createPageCursors(
                    {
                      page,
                      size,
                    },
                    total_count
                  ),
                },
                {
                  totalCount: total_count,
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
            description: "If true, will return featured bio over Artsy one.",
            defaultValue: false,
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
        resolve: (
          { blurb, id },
          { format, partnerBio: partner_bio },
          { partnerArtistsForArtistLoader }
        ) => {
          if (!partner_bio && blurb && blurb.length) {
            return { text: formatMarkdownValue(blurb, format) }
          }
          return partnerArtistsForArtistLoader(id, {
            size: 1,
            featured: true,
          }).then((partner_artists) => {
            if (partner_artists && partner_artists.length) {
              const { biography, partner } = first(partner_artists) as any
              return {
                text: formatMarkdownValue(biography, format),
                credit: `Submitted by ${partner.name}`,
                partner_id: partner.id,
                partner: partner,
              }
            }
            return { text: formatMarkdownValue(blurb, format) }
          })
        },
      },
      birthday: { type: GraphQLString },
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
          },
        }),
        resolve: (artist) => artist,
      },
      createdAt: date(),
      criticallyAcclaimed: {
        type: GraphQLBoolean,
        resolve: ({ critically_acclaimed }) => critically_acclaimed,
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
      isPublic: { type: GraphQLBoolean, resolve: (artist) => artist.public },
      isShareable: {
        type: GraphQLBoolean,
        resolve: (artist) => artist.published_artworks_count > 0,
      },
      displayLabel: { type: GraphQLString, resolve: ({ name }) => name },
      location: { type: GraphQLString },
      meta: Meta,
      nationality: { type: GraphQLString },
      name: { type: GraphQLString },
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

export const artistConnection = connectionWithCursorInfo({
  nodeType: ArtistType,
})
