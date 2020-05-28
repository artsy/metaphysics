import { pageable, getPagingParameters } from "relay-cursor-paging"
import {
  compact,
  defaults,
  first,
  flatten,
  omit,
  includes,
  merge,
} from "lodash"
import { exclude } from "lib/helpers"
import cached from "schema/v1/fields/cached"
import initials from "schema/v1/fields/initials"
import { markdown, formatMarkdownValue } from "schema/v1/fields/markdown"
import numeral from "schema/v1/fields/numeral"
import Image, { getDefault } from "schema/v1/image"
import { setVersion } from "schema/v1/image/normalize"
import Article, { articleConnection } from "schema/v1/article"
import Artwork, { artworkConnection } from "schema/v1/artwork"
import PartnerArtist from "schema/v1/partner_artist"
import Meta from "./meta"
import PartnerShow from "schema/v1/partner_show"
import {
  PartnerArtistConnection,
  partnersForArtist,
} from "schema/v1/partner_artist"
import { GeneType } from "../gene"
import Show, { showConnection } from "schema/v1/show"
import Sale from "schema/v1/sale/index"
import ArtworkSorts from "schema/v1/sorts/artwork_sorts"
import ArticleSorts from "schema/v1/sorts/article_sorts"
import SaleSorts from "schema/v1/sale/sorts"
import ArtistCarousel from "./carousel"
import ArtistStatuses from "./statuses"
import ArtistHighlights from "./highlights"
import { ArtistInsights } from "./insights"
import { CurrentEvent } from "./current"
import {
  auctionResultConnection,
  AuctionResultSorts,
} from "schema/v1/auction_result"
import ArtistArtworksFilters from "./artwork_filters"
import { Searchable } from "schema/v1/searchable"
import filterArtworks from "schema/v1/filter_artworks"
import { connectionWithCursorInfo } from "schema/v1/fields/pagination"
import { Related } from "./related"
import { createPageCursors } from "schema/v1/fields/pagination"
import {
  ShowField,
  showsWithDenyListedPartnersRemoved,
  ShowsConnectionField,
} from "./shows"
import {
  NodeInterface,
  SlugAndInternalIDFields,
} from "schema/v1/object_identification"
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLFieldConfig,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { totalViaLoader } from "lib/total"
import { ResolverContext } from "types/graphql"
import { deprecate } from "lib/deprecation"

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
  interfaces: [NodeInterface, Searchable],
  fields: () => {
    return {
      ...SlugAndInternalIDFields,
      cached,
      alternate_names: { type: new GraphQLList(GraphQLString) },
      articlesConnection: {
        args: pageable({
          sort: ArticleSorts,
          limit: {
            type: GraphQLInt,
          },
          in_editorial_feed: {
            type: GraphQLBoolean,
          },
        }),
        type: articleConnection,
        resolve: ({ _id }, args, { articlesLoader }) => {
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
      articles: {
        args: {
          sort: ArticleSorts,
          limit: { type: GraphQLInt },
          in_editorial_feed: { type: GraphQLBoolean },
        },
        type: new GraphQLList(Article.type),
        resolve: ({ _id }, options, { articlesLoader }) =>
          articlesLoader(
            defaults(options, {
              artist_id: _id,
              published: true,
            })
          ).then(({ results }) => results),
      },
      artists: {
        type: new GraphQLList(Artist.type),
        args: {
          size: {
            type: GraphQLInt,
            description: "The number of Artists to return",
          },
          exclude_artists_without_artworks: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
        },
        resolve: ({ id }, options, { relatedMainArtistsLoader }) =>
          relatedMainArtistsLoader(
            defaults(options, {
              artist: [id],
            })
          ).then(({ body }) => body),
      },
      artworks: {
        type: new GraphQLList(Artwork.type),
        args: {
          size: {
            type: GraphQLInt,
            description: "The number of Artworks to return",
          },
          page: { type: GraphQLInt },
          sort: ArtworkSorts,
          published: { type: GraphQLBoolean, defaultValue: true },
          filter: { type: new GraphQLList(ArtistArtworksFilters) },
          exclude: { type: new GraphQLList(GraphQLString) },
        },
        resolve: ({ id }, options, { artistArtworksLoader }) =>
          artistArtworksLoader(id, options).then(
            exclude(options.exclude, "id")
          ),
      },
      artworks_connection: {
        type: artworkConnection,
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
      auctionResults: {
        type: auctionResultConnection,
        args: pageable({
          sort: AuctionResultSorts,
          recordsTrusted: {
            type: GraphQLBoolean,
            defaultValue: false,
            description:
              "When true, will only return records for allowed artists.",
          },
        }),
        resolve: ({ _id }, options, { auctionLotLoader }) => {
          if (options.recordsTrusted && !includes(auctionRecordsTrusted, _id)) {
            return null
          }

          // Convert `after` cursors to page params
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            options
          )
          const diffusionArgs = {
            page,
            size,
            artist_id: _id,
            sort: options.sort,
          }
          return auctionLotLoader(diffusionArgs).then(
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
                }
              )
            }
          )
        },
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
      biography_blurb: {
        args: {
          partner_bio: {
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
            partner_id: {
              type: GraphQLString,
              resolve: ({ partner_id }) => partner_id,
              description:
                "The partner id of the partner who submitted the featured bio.",
            },
          },
        }),
        resolve: (
          { blurb, id },
          { format, partner_bio },
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
          exclude_artists_without_artworks: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
        },
        resolve: ({ id }, options, { relatedContemporaryArtistsLoader }) =>
          relatedContemporaryArtistsLoader(
            defaults(options, {
              artist: [id],
            })
          ).then(({ body }) => body),
      },
      consignable: {
        type: GraphQLBoolean,
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "is_*",
        }),
      },
      counts: {
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "ArtistCounts",
          fields: {
            artworks: numeral(
              ({ published_artworks_count }) => published_artworks_count
            ),
            follows: numeral(({ follow_count }) => follow_count),
            for_sale_artworks: numeral(
              ({ forsale_artworks_count }) => forsale_artworks_count
            ),
            partner_shows: numeral(
              ({ partner_shows_count }) => partner_shows_count
            ),
            related_artists: {
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
            ecommerce_artworks: numeral(
              ({ ecommerce_artworks_count }) => ecommerce_artworks_count
            ),
            has_make_offer_artworks: {
              type: GraphQLBoolean,
              resolve: ({ has_make_offer_artworks }) => has_make_offer_artworks,
            },
            auction_artworks: numeral(
              ({ auction_artworks_count }) => auction_artworks_count
            ),
          },
        }),
        resolve: (artist) => artist,
      },
      currentEvent: CurrentEvent,
      deathday: { type: GraphQLString },
      disablePriceContext: {
        type: GraphQLBoolean,
        resolve: ({ disable_price_context }) => disable_price_context,
      },
      display_auction_link: {
        type: GraphQLBoolean,
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "is_*",
        }),
      },
      exhibition_highlights: {
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
      filtered_artworks: filterArtworks("artist_id"),
      formatted_artworks_count: {
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
      formatted_nationality_and_birthday: {
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
      href: {
        type: GraphQLString,
        resolve: (artist) => `/artist/${artist.id}`,
      },
      has_metadata: {
        type: GraphQLBoolean,
        resolve: ({ blurb, nationality, years, hometown, location }) => {
          return !!(blurb || nationality || years || hometown || location)
        },
      },
      hometown: { type: GraphQLString },
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
      is_consignable: {
        type: GraphQLBoolean,
        resolve: ({ consignable }) => consignable,
      },
      is_display_auction_link: {
        type: GraphQLBoolean,
        description:
          "Only specific Artists should show a link to auction results.",
        resolve: ({ display_auction_link }) => display_auction_link,
      },
      is_followed: {
        type: GraphQLBoolean,
        resolve: ({ id }, _args, { followedArtistLoader }) => {
          if (!followedArtistLoader) return false
          return followedArtistLoader(id).then(({ is_followed }) => is_followed)
        },
      },
      is_public: { type: GraphQLBoolean, resolve: (artist) => artist.public },
      is_shareable: {
        type: GraphQLBoolean,
        resolve: (artist) => artist.published_artworks_count > 0,
      },
      displayLabel: { type: GraphQLString, resolve: ({ name }) => name },
      location: { type: GraphQLString },
      meta: Meta,
      nationality: { type: GraphQLString },
      name: { type: GraphQLString },
      partners: {
        type: PartnerArtistConnection,
        args: pageable({
          represented_by: {
            type: GraphQLBoolean,
          },
          partner_category: {
            type: new GraphQLList(GraphQLString),
          },
        }),
        resolve: ({ id: artist_id }, options, { partnerArtistsLoader }) => {
          return partnersForArtist(artist_id, options, partnerArtistsLoader)
        },
      },
      partner_artists: {
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
      partner_shows: {
        ...ShowField,
        type: new GraphQLList(PartnerShow.type),
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "shows",
        }),
      },
      public: {
        type: GraphQLBoolean,
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "is_*",
        }),
      },
      related: Related,
      sales: {
        type: new GraphQLList(Sale.type),
        args: {
          live: { type: GraphQLBoolean },
          is_auction: { type: GraphQLBoolean },
          size: {
            type: GraphQLInt,
            description: "The number of Sales to return",
          },
          sort: SaleSorts,
        },
        resolve: ({ id }, options, { relatedSalesLoader }) =>
          relatedSalesLoader(
            defaults(options, {
              artist_id: id,
              sort: "timely_at,name",
            })
          ),
      },
      shows: { ...ShowField, type: new GraphQLList(Show.type) },
      showsConnection: { ...ShowsConnectionField, type: showConnection },
      sortable_id: {
        type: GraphQLString,
        description:
          "Use this attribute to sort by when sorting a collection of Artists",
      },
      statuses: ArtistStatuses,
      highlights: ArtistHighlights,
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

export const artistConnection = connectionWithCursorInfo(ArtistType)
