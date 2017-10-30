// @ts-check
import type { GraphQLFieldConfig } from "graphql"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { assign, compact, defaults, first, has, reject, includes } from "lodash"
import { exclude } from "lib/helpers"
import cached from "schema/fields/cached"
import initials from "schema/fields/initials"
import { markdown, formatMarkdownValue } from "schema/fields/markdown"
import numeral from "schema/fields/numeral"
import Image from "schema/image"
import Article from "schema/article"
import Artwork, { artworkConnection } from "schema/artwork"
import PartnerArtist from "schema/partner_artist"
import Meta from "./meta"
import PartnerShow from "schema/partner_show"
import Show from "schema/show"
import Sale from "schema/sale/index"
import ArtworkSorts from "schema/sorts/artwork_sorts"
import ArticleSorts from "schema/sorts/article_sorts"
import PartnerShowSorts from "schema/sorts/partner_show_sorts"
import SaleSorts from "schema/sale/sorts"
import ArtistCarousel from "./carousel"
import ArtistStatuses from "./statuses"
import ArtistArtworksFilters from "./artwork_filters"
import positron from "lib/loaders/legacy/positron"
import total from "lib/loaders/legacy/total"
import { GravityIDFields, NodeInterface } from "schema/object_identification"
import { GraphQLObjectType, GraphQLBoolean, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInt } from "graphql"

const artistArtworkArrayLength = (artist, filter) => {
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

// TODO: Fix upstream, for now we remove shows from certain Partner types
const blacklistedPartnerTypes = ["Private Dealer", "Demo", "Private Collector", "Auction"]
const showsWithBLacklistedPartnersRemoved = shows => {
  return reject(shows, show => {
    if (show.partner) {
      return includes(blacklistedPartnerTypes, show.partner.type)
    }
    if (show.galaxy_partner_id) {
      return false
    }
    return true
  })
}

// TODO Get rid of this when we remove the deprecated PartnerShow in favour of Show.
const ShowField = {
  args: {
    active: {
      type: GraphQLBoolean,
    },
    at_a_fair: {
      type: GraphQLBoolean,
    },
    is_reference: {
      type: GraphQLBoolean,
    },
    size: {
      type: GraphQLInt,
      description: "The number of PartnerShows to return",
    },
    solo_show: {
      type: GraphQLBoolean,
    },
    status: {
      type: GraphQLString,
    },
    top_tier: {
      type: GraphQLBoolean,
    },
    visible_to_public: {
      type: GraphQLBoolean,
    },
    sort: PartnerShowSorts,
  },
  resolve: ({ id }, options, request, { rootValue: { relatedShowsLoader } }) => {
    return relatedShowsLoader(
      defaults(options, {
        artist_id: id,
        sort: "-end_at",
      })).then(shows => showsWithBLacklistedPartnersRemoved(shows))
  },
}

export const ArtistType = new GraphQLObjectType({
  name: "Artist",
  interfaces: [NodeInterface],
  isTypeOf: obj => has(obj, "birthday") && has(obj, "artworks_count"),
  fields: () => {
    return {
      ...GravityIDFields,
      cached,
      alternate_names: {
        type: new GraphQLList(GraphQLString),
      },
      articles: {
        args: {
          sort: ArticleSorts,
          limit: {
            type: GraphQLInt,
          },
        },
        type: new GraphQLList(Article.type),
        resolve: ({ _id }, options, request, { rootValue: { articlesLoader } }) =>
          articlesLoader(
            defaults(options, {
              artist_id: _id,
              published: true,
            })
          ).then(({ results }) => results),
      },
      artists: {
        type: new GraphQLList(Artist.type), // eslint-disable-line no-use-before-define
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
        resolve: ({ id }, options, request, { rootValue: { relatedMainArtistsLoader } }) =>
          relatedMainArtistsLoader(
            defaults(options, {
              artist: [id],
            })
          ),
      },
      artworks: {
        type: new GraphQLList(Artwork.type),
        args: {
          size: {
            type: GraphQLInt,
            description: "The number of Artworks to return",
          },
          page: {
            type: GraphQLInt,
          },
          sort: ArtworkSorts,
          published: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
          filter: {
            type: new GraphQLList(ArtistArtworksFilters),
          },
          exclude: {
            type: new GraphQLList(GraphQLString),
          },
        },
        resolve: ({ id }, options, request, { rootValue: { artistArtworksLoader } }) =>
          artistArtworksLoader(id, options).then(exclude(options.exclude, "id")),
      },
      artworks_connection: {
        type: artworkConnection,
        args: pageable({
          sort: ArtworkSorts,
          filter: {
            type: new GraphQLList(ArtistArtworksFilters),
          },
          published: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
        }),
        resolve: (artist, options, request, { rootValue: { artistArtworksLoader } }) => {
          // Convert `after` cursors to page params
          const { limit: size, offset } = getPagingParameters(options)
          // Construct an object of all the params gravity will listen to
          const { sort, filter, published } = options
          const gravityArgs = { size, offset, sort, filter, published }
          return artistArtworksLoader(artist.id, gravityArgs).then(artworks =>
            connectionFromArraySlice(artworks, options, {
              arrayLength: artistArtworkArrayLength(artist, filter),
              sliceStart: offset,
            })
          )
        },
      },
      bio: {
        type: GraphQLString,
        resolve: ({ nationality, years, hometown, location }) => {
          return compact([nationality, years, hometown, location ? `based in ${location}` : undefined]).join(", ")
        },
      },
      biography: {
        type: Article.type,
        description: "The Artist biography article written by Artsy",
        resolve: ({ _id }, options, request, { rootValue: { articlesLoader } }) =>
          articlesLoader({
            published: true,
            biography_for_artist_id: _id,
            limit: 1,
          }).then(articles => first(articles.results)),
      },
      biography_blurb: {
        args: assign(
          {
            partner_bio: {
              type: GraphQLBoolean,
              description: "If true, will return featured bio over Artsy one.",
              defaultValue: false,
            },
          },
          markdown().args
        ),
        type: new GraphQLObjectType({
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
              description: "The partner id of the partner who submitted the featured bio.",
            },
          },
        }),
        resolve: ({ blurb, id }, { format, partner_bio }, request, { rootValue: { partnerArtistsLoader } }) => {
          if (!partner_bio && blurb && blurb.length) {
            return { text: formatMarkdownValue(blurb, format) }
          }
          return partnerArtistsLoader(id, {
            size: 1,
            featured: true,
          }).then(partner_artists => {
            if (partner_artists && partner_artists.length) {
              const { biography, partner } = first(partner_artists)
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
      birthday: {
        type: GraphQLString,
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
      contemporary: {
        type: new GraphQLList(Artist.type), // eslint-disable-line no-use-before-define
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
        resolve: ({ id }, options, request, { rootValue: { relatedContemporaryArtistsLoader } }) =>
          relatedContemporaryArtistsLoader(
            defaults(options, {
              artist: [id],
            })
          ),
      },
      consignable: {
        type: GraphQLBoolean,
        deprecationReason: "Favor `is_`-prefixed boolean attributes",
      },
      counts: {
        type: new GraphQLObjectType({
          name: "ArtistCounts",
          fields: {
            artworks: numeral(({ published_artworks_count }) => published_artworks_count),
            follows: numeral(({ follow_count }) => follow_count),
            for_sale_artworks: numeral(({ forsale_artworks_count }) => forsale_artworks_count),
            partner_shows: numeral(({ partner_shows_count }) => partner_shows_count),
            related_artists: numeral(({ id }) => total(`related/layer/main/artists`, { artist: id })),
            articles: numeral(({ _id }) =>
              positron("articles", {
                artist_id: _id,
                published: true,
                limit: 1,
                count: true,
              }).then(({ count }) => count)
            ),
          },
        }),
        resolve: artist => artist,
      },
      deathday: {
        type: GraphQLString,
      },
      display_auction_link: {
        type: GraphQLBoolean,
        deprecationReason: "Favor `is_`-prefixed boolean attributes",
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
        description: "Custom-sorted list of shows for an artist, in order of significance.",
        resolve: ({ id }, options, request, { rootValue: { relatedShowsLoader } }) => {
          return relatedShowsLoader({
            artist_id: id,
            sort: "-relevance,-start_at",
            is_reference: true,
            visible_to_public: false,
            size: options.size,
          }).then(shows => showsWithBLacklistedPartnersRemoved(shows))
        },
      },
      formatted_artworks_count: {
        type: GraphQLString,
        description: "A string showing the total number of works and those for sale",
        resolve: ({ published_artworks_count, forsale_artworks_count }) => {
          let totalWorks = null
          if (published_artworks_count) {
            totalWorks = published_artworks_count + (published_artworks_count > 1 ? " works" : " work")
          }
          const forSaleWorks = forsale_artworks_count ? forsale_artworks_count + " for sale" : null
          return forSaleWorks && totalWorks ? totalWorks + ", " + forSaleWorks : totalWorks
        },
      },
      formatted_nationality_and_birthday: {
        type: GraphQLString,
        description: `A string of the form "Nationality, Birthday (or Birthday-Deathday)"`,
        resolve: ({ birthday, nationality, deathday }) => {
          let formatted_bday = !isNaN(birthday) && birthday ? "b. " + birthday : birthday
          formatted_bday = formatted_bday && formatted_bday.replace(/born/i, "b.")

          if (!isNaN(deathday) && deathday && formatted_bday) {
            formatted_bday = `${formatted_bday.replace("b. ", "")}–${deathday.match(/\d+/)}`
          }
          if (nationality && formatted_bday) {
            return nationality + ", " + formatted_bday
          }
          return nationality || formatted_bday
        },
      },
      gender: {
        type: GraphQLString,
      },
      href: {
        type: GraphQLString,
        resolve: artist => `/artist/${artist.id}`,
      },
      has_metadata: {
        type: GraphQLBoolean,
        resolve: ({ blurb, nationality, years, hometown, location }) => {
          return !!(blurb || nationality || years || hometown || location)
        },
      },
      hometown: {
        type: GraphQLString,
      },
      image: Image,
      initials: initials("name"),
      is_consignable: {
        type: GraphQLBoolean,
        resolve: ({ consignable }) => consignable,
      },
      is_display_auction_link: {
        type: GraphQLBoolean,
        description: "Only specific Artists should show a link to auction results.",
        resolve: ({ display_auction_link }) => display_auction_link,
      },
      is_followed: {
        type: GraphQLBoolean,
        resolve: ({ id }, {}, request, { rootValue: { followedArtistLoader } }) => {
          if (!followedArtistLoader) return false
          return followedArtistLoader(id).then(({ is_followed }) => is_followed)
        },
      },
      is_public: {
        type: GraphQLBoolean,
        resolve: artist => artist.public,
      },
      is_shareable: {
        type: GraphQLBoolean,
        resolve: artist => artist.published_artworks_count > 0,
      },
      location: {
        type: GraphQLString,
      },
      meta: Meta,
      nationality: {
        type: GraphQLString,
      },
      name: {
        type: GraphQLString,
      },
      partner_artists: {
        type: new GraphQLList(PartnerArtist.type),
        args: {
          size: {
            type: GraphQLInt,
            description: "The number of PartnerArtists to return",
          },
        },
        resolve: ({ id }, options, request, { rootValue: { partnerArtistsLoader } }) =>
          partnerArtistsLoader(id, options),
      },
      partner_shows: {
        type: new GraphQLList(PartnerShow.type),
        deprecationReason: "Prefer to use shows attribute",
        ...ShowField,
      },
      public: {
        type: GraphQLBoolean,
        deprecationReason: "Favor `is_`-prefixed boolean attributes",
      },
      sales: {
        type: new GraphQLList(Sale.type),
        args: {
          live: {
            type: GraphQLBoolean,
          },
          is_auction: {
            type: GraphQLBoolean,
          },
          size: {
            type: GraphQLInt,
            description: "The number of Sales to return",
          },
          sort: SaleSorts,
        },
        resolve: ({ id }, options, request, { rootValue: { relatedSalesLoader } }) =>
          relatedSalesLoader(
            defaults(options, {
              artist_id: id,
              sort: "timely_at,name",
            })
          ),
      },
      shows: {
        type: new GraphQLList(Show.type),
        ...ShowField,
      },
      sortable_id: {
        type: GraphQLString,
        description: "Use this attribute to sort by when sorting a collection of Artists",
      },
      statuses: ArtistStatuses,
      years: {
        type: GraphQLString,
      },
    }
  },
})
const Artist: GraphQLFieldConfig<ArtistType, *> = {
  type: ArtistType,
  description: "An Artist",
  args: {
    id: {
      description: "The slug or ID of the Artist",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (root, { id }, request, resolver) => {
    if (id.length === 0) {
      return null
    }
    const { artistLoader } = (resolver.rootValue: any)
    return artistLoader(id)
  },
}
export default Artist

export const artistConnection = connectionDefinitions({
  nodeType: Artist.type,
}).connectionType
