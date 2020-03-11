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
import cached from "schema/v2/fields/cached"
import initials from "schema/v2/fields/initials"
import { markdown, formatMarkdownValue } from "schema/v2/fields/markdown"
import numeral from "schema/v2/fields/numeral"
import Image, { getDefault } from "schema/v2/image"
import { setVersion } from "schema/v2/image/normalize"
import Article, { articleConnection } from "schema/v2/article"
import { artworkConnection } from "schema/v2/artwork"
import PartnerArtist from "schema/v2/partner_artist"
import Meta from "./meta"
import { partnersForArtist } from "schema/v2/partner_artist"
import { GeneType } from "../gene"
import Show from "schema/v2/show"
import Sale from "schema/v2/sale/index"
import ArtworkSorts from "schema/v2/sorts/artwork_sorts"
import ArticleSorts from "schema/v2/sorts/article_sorts"
import SaleSorts from "schema/v2/sale/sorts"
import ArtistCarousel from "./carousel"
import ArtistStatuses from "./statuses"
import ArtistHighlights from "./highlights"
import { ArtistInsights } from "./insights"
import { CurrentEvent } from "./current"
import {
  auctionResultConnection,
  AuctionResultSorts,
} from "schema/v2/auction_result"
import ArtistArtworksFilters from "./artwork_filters"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { Related } from "./related"
import { createPageCursors } from "schema/v2/fields/pagination"
import {
  showsWithDenyListedPartnersRemoved,
  ShowsConnectionField,
} from "./shows"
import { SlugAndInternalIDFields } from "schema/v2/object_identification"
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
import ArtworkSizes from "../artwork/artworkSizes"

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

          return artistArtworksLoader(artist.id, gravityArgs).then(artworks =>
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
        }),
        resolve: ({ _id }, options, { auctionLotLoader }) => {
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
            earliest_created_year: options.earliestCreatedYear,
            latest_created_year: options.latestCreatedYear,
            sizes,
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
                },
                {
                  artist_id: _id,
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
          }).then(articles => first(articles.results)),
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
              description:
                "The partner id of the partner who submitted the featured bio.",
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
          }).then(partner_artists => {
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
          },
        }),
        resolve: artist => artist,
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
          return artistGenesLoader(id).then(genes => genes)
        },
      },
      gender: { type: GraphQLString },
      href: { type: GraphQLString, resolve: artist => `/artist/${artist.id}` },
      hasMetadata: {
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
      isPublic: { type: GraphQLBoolean, resolve: artist => artist.public },
      isShareable: {
        type: GraphQLBoolean,
        resolve: artist => artist.published_artworks_count > 0,
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

export const artistConnection = connectionWithCursorInfo({
  nodeType: ArtistType,
})
