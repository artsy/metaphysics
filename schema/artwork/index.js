import _ from "lodash"
import { isTwoDimensional, isTooBig, isEmbeddedVideo, embed } from "./utilities"
import { enhance, existyValue, isExisty } from "lib/helpers"
import { connectionDefinitions } from "graphql-relay"
import cached from "schema/fields/cached"
import { markdown } from "schema/fields/markdown"
import Article from "schema/article"
import Artist from "schema/artist"
import Image, { getDefault } from "schema/image"
import Fair from "schema/fair"
import Sale from "schema/sale"
import SaleArtwork from "schema/sale_artwork"
import PartnerShow from "schema/partner_show"
import PartnerShowSorts from "schema/sorts/partner_show_sorts"
import Partner from "schema/partner"
import Context from "./context"
import Meta, { artistNames } from "./meta"
import Highlight from "./highlight"
import Dimensions from "schema/dimensions"
import EditionSet from "schema/edition_set"
import ArtworkLayer from "./layer"
import ArtworkLayers, { artworkLayers } from "./layers"
import gravity from "lib/loaders/gravity"
import positron from "lib/loaders/positron"
import savedArtworkLoader from "lib/loaders/saved_artwork"
import { GravityIDFields, NodeInterface } from "schema/object_identification"
import { GraphQLObjectType, GraphQLBoolean, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInt } from "graphql"

const is_inquireable = ({ inquireable, acquireable }) => {
  return inquireable && !acquireable
}

const has_price_range = price => {
  return new RegExp(/\-/).test(price)
}

const has_multiple_editions = edition_sets => {
  return edition_sets && edition_sets.length > 0
}

let Artwork

export const artworkFields = () => {
  return {
    ...GravityIDFields,
    additional_information: markdown(),
    artist: {
      type: Artist.type,
      args: {
        shallow: {
          type: GraphQLBoolean,
          description: "Use whatever is in the original response instead of making a request",
        },
      },
      resolve: ({ artist }, { shallow }, request, { rootValue: { artistLoader } }) => {
        if (!artist) return null
        if (shallow) return artist
        return artistLoader(artist.id).catch(() => null)
      },
    },
    artists: {
      type: new GraphQLList(Artist.type),
      args: {
        shallow: {
          type: GraphQLBoolean,
          description: "Use whatever is in the original response instead of making a request",
        },
      },
      resolve: ({ artists }, { shallow }, request, { rootValue: { artistLoader } }) => {
        if (shallow) return artists
        return Promise.all(artists.map(artist => artistLoader(artist.id))).catch(() => [])
      },
    },
    artist_names: {
      type: GraphQLString,
      resolve: artwork => artistNames(artwork),
    },
    articles: {
      type: new GraphQLList(Article.type),
      args: {
        size: {
          type: GraphQLInt,
        },
      },
      resolve: ({ _id }, { size }) =>
        positron("articles", {
          artwork_id: _id,
          published: true,
          limit: size,
        }).then(({ results }) => results),
    },
    availability: {
      type: GraphQLString,
    },
    can_share_image: {
      type: GraphQLBoolean,
      deprecationReason: "Favor `is_`-prefixed boolean attributes",
    },
    category: {
      type: GraphQLString,
    },
    collecting_institution: {
      type: GraphQLString,
      resolve: ({ collecting_institution }) => existyValue(collecting_institution),
    },
    contact_label: {
      type: GraphQLString,
      resolve: ({ partner }) => {
        return partner.type === "Gallery" ? "Gallery" : "Seller"
      },
    },
    contact_message: {
      type: GraphQLString,
      description: "Pre-filled inquiry text",
      resolve: ({ partner, availability }) => {
        if (partner && partner.type === "Auction") {
          return ["Hello, I am interested in placing a bid on this work.", "Please send me more information."].join(" ")
        }
        if (availability === "sold") {
          return [
            "Hi, I’m interested in similar works by this artist.",
            "Could you please let me know if you have anything available?",
          ].join(" ")
        }
        if (availability !== "not for sale") {
          return [
            "Hi, I’m interested in purchasing this work.",
            "Could you please provide more information about the piece?",
          ].join(" ")
        }
      },
    },
    context: Context,
    cultural_maker: {
      type: GraphQLString,
    },
    date: {
      type: GraphQLString,
    },
    description: markdown(({ blurb }) => blurb),
    dimensions: Dimensions,
    embed: {
      type: GraphQLString,
      description: "Returns an HTML string representing the embedded content (video)",
      args: {
        width: {
          type: GraphQLInt,
          defaultValue: 853,
        },
        height: {
          type: GraphQLInt,
          defaultValue: 450,
        },
        autoplay: {
          type: GraphQLBoolean,
          defaultValue: false,
        },
      },
      resolve: ({ website }, options) => (isEmbeddedVideo ? embed(website, options) : null),
    },
    edition_of: {
      type: GraphQLString,
      resolve: ({ unique, edition_sets }) => {
        if (unique) return "Unique"
        if (edition_sets && edition_sets.length === 1) {
          return _.first(edition_sets).editions
        }
      },
    },
    edition_sets: {
      type: new GraphQLList(EditionSet.type),
      resolve: ({ edition_sets }) => edition_sets,
    },
    exhibition_history: markdown(),
    fair: {
      type: Fair.type,
      resolve: ({ id }, options, request, { rootValue: { relatedFairsLoader } }) => {
        return relatedFairsLoader(id, { artwork: [id], size: 1 }).then(_.first)
      },
    },
    highlights: {
      type: new GraphQLList(Highlight),
      description: "Returns the highlighted shows and articles",
      resolve: ({ id, _id }, options, request, { rootValue: { relatedShowsLoader, articlesLoader } }) =>
        Promise.all([
          relatedShowsLoader(id, { artwork: [id], size: 1, at_a_fair: false }),
          articlesLoader(_id, {
            artwork_id: _id,
            published: true,
            limit: 1,
          }).then(({ results }) => results),
        ]).then(([shows, articles]) => {
          const highlightedShows = enhance(shows, { highlight_type: "Show" })
          const highlightedArticles = enhance(articles, {
            highlight_type: "Article",
          })
          return highlightedShows.concat(highlightedArticles)
        }),
    },
    href: {
      type: GraphQLString,
      resolve: ({ id }) => `/artwork/${id}`,
    },
    image: {
      type: Image.type,
      resolve: ({ images }) => {
        return Image.resolve(getDefault(images))
      },
    },
    image_rights: {
      type: GraphQLString,
    },
    image_title: {
      type: GraphQLString,
      resolve: ({ artist, title, date }) => {
        return _.compact([artist && artist.name, title && `‘${title}’`, date]).join(", ")
      },
    },
    images: {
      type: new GraphQLList(Image.type),
      args: {
        size: {
          type: GraphQLInt,
        },
      },
      resolve: ({ images }, { size }) => {
        const sorted = _.sortBy(images, "position")
        return Image.resolve(size ? _.take(sorted, size) : sorted)
      },
    },
    is_acquireable: {
      type: GraphQLBoolean,
      description: "Whether work can be purchased through e-commerce",
      resolve: ({ acquireable }) => acquireable,
    },
    is_biddable: {
      type: GraphQLBoolean,
      description: "Is this artwork part of an auction that is currently running?",
      resolve: ({ sale_ids }, options, request, { rootValue: { salesLoader } }) => {
        if (sale_ids && sale_ids.length > 0) {
          return salesLoader(null, {
            id: sale_ids,
            is_auction: true,
            live: true,
          }).then(sales => {
            return sales.length > 0
          })
        }
        return false
      },
    },
    is_buy_nowable: {
      type: GraphQLBoolean,
      description: "When in an auction, can the work be bought immediately",
      resolve: ({ id, acquireable, sale_ids }, options, request, { rootValue: { salesLoader } }) => {
        if (sale_ids && sale_ids.length > 0 && acquireable) {
          return salesLoader(id, {
            id: sale_ids,
            is_auction: true,
            live: true,
          }).then(sales => {
            return sales.length > 0
          })
        }
        return false
      },
    },
    is_comparable_with_auction_results: {
      type: GraphQLBoolean,
      resolve: ({ comparables_count, category }) => {
        return comparables_count > 0 && category !== "Architecture"
      },
    },
    is_contactable: {
      type: GraphQLBoolean,
      description: "Are we able to display a contact form on artwork pages?",
      deprecationReason: "Prefer to use is_inquireable",
      resolve: (artwork, options, request, { rootValue: { relatedSalesLoader } }) => {
        return relatedSalesLoader(null, {
          size: 1,
          active: true,
          artwork: [artwork.id],
        })
          .then(sales => {
            return (
              artwork.forsale &&
              !_.isEmpty(artwork.partner) &&
              !artwork.acquireable &&
              !artwork.partner.has_limited_fair_partnership &&
              !sales.length
            )
          })
          .catch(() => false)
      },
    },
    is_downloadable: {
      type: GraphQLBoolean,
      resolve: ({ images }) => _.first(images).downloadable,
    },
    is_embeddable_video: {
      type: GraphQLBoolean,
      resolve: isEmbeddedVideo,
    },
    is_ecommerce: {
      type: GraphQLBoolean,
      deprecationReason: "Should not be used to determine anything UI-level",
      resolve: ({ ecommerce }) => ecommerce,
    },
    is_for_sale: {
      type: GraphQLBoolean,
      resolve: ({ forsale }) => forsale,
    },
    is_hangable: {
      type: GraphQLBoolean,
      resolve: artwork => {
        return (
          !_.includes(artwork.category, "sculpture", "installation", "design") &&
          isTwoDimensional(artwork) &&
          !isTooBig(artwork)
        )
      },
    },
    is_inquireable: {
      type: GraphQLBoolean,
      description: "Do we want to encourage inquiries on this work?",
      resolve: artwork => is_inquireable(artwork),
    },
    is_in_auction: {
      type: GraphQLBoolean,
      description: "Is this artwork part of an auction?",
      resolve: ({ sale_ids }, options, request, { rootValue: { salesLoader } }) => {
        if (sale_ids && sale_ids.length > 0) {
          return salesLoader(null, {
            id: sale_ids,
            is_auction: true,
          }).then(sales => {
            return sales.length > 0
          })
        }
        return false
      },
    },
    is_in_show: {
      type: GraphQLBoolean,
      description: "Is this artwork part of a current show",
      resolve: ({ id }, options, request, { rootValue: { relatedShowsLoader } }) =>
        relatedShowsLoader(null, { active: true, size: 1, artwork: [id] }).then(shows => shows.length > 0),
    },
    is_not_for_sale: {
      type: GraphQLString,
      resolve: ({ availability }) => availability === "not for sale",
    },
    is_on_hold: {
      type: GraphQLString,
      resolve: ({ availability }) => availability === "on hold",
    },
    is_price_hidden: {
      type: GraphQLBoolean,
      resolve: ({ price_hidden }) => price_hidden,
    },
    is_price_range: {
      type: GraphQLBoolean,
      resolve: ({ price, edition_sets }) => has_price_range(price) && !has_multiple_editions(edition_sets), // eslint-disable-line max-len
    },
    is_purchasable: {
      type: GraphQLBoolean,
      description: "True for inquireable artworks that have an exact price.",
      resolve: artwork => {
        return (
          !has_multiple_editions(artwork.edition_sets) &&
          is_inquireable(artwork) &&
          isExisty(artwork.price) &&
          !has_price_range(artwork.price) &&
          artwork.forsale
        )
      },
    },
    is_saved: {
      type: GraphQLBoolean,
      resolve: ({ id }, {}, request, { rootValue: { accessToken, userID } }) => {
        if (!accessToken) return false
        return savedArtworkLoader.load(JSON.stringify({ id, userID, accessToken })).then(({ is_saved }) => is_saved)
      },
    },
    is_shareable: {
      type: GraphQLBoolean,
      resolve: ({ can_share_image }) => can_share_image,
    },
    is_sold: {
      type: GraphQLBoolean,
      resolve: ({ sold }) => sold,
    },
    is_unique: {
      type: GraphQLBoolean,
      resolve: ({ unique }) => unique,
    },
    layer: {
      type: ArtworkLayer.type,
      args: {
        id: {
          type: GraphQLString,
        },
      },
      resolve: (artwork, { id }) =>
        artworkLayers(artwork.id).then(layers => (!!id ? _.find(layers, { id }) : _.first(layers))),
    },
    layers: {
      type: ArtworkLayers.type,
      resolve: ({ id }) => artworkLayers(id),
    },
    literature: markdown(({ literature }) => literature.replace(/^literature:\s+/i, "")),
    manufacturer: markdown(),
    medium: {
      type: GraphQLString,
    },
    meta: Meta,
    partner: {
      type: Partner.type,
      args: {
        shallow: {
          type: GraphQLBoolean,
          description: "Use whatever is in the original response instead of making a request",
        },
      },
      resolve: ({ partner }, { shallow }, request, { rootValue: { partnerLoader } }) => {
        if (shallow) return partner
        return partnerLoader(partner.id).catch(() => null)
      },
    },
    price: {
      type: GraphQLString,
    },
    provenance: markdown(({ provenance }) => provenance.replace(/^provenance:\s+/i, "")),
    publisher: markdown(),
    related: {
      type: new GraphQLList(Artwork.type),
      args: {
        size: {
          type: GraphQLInt,
        },
      },
      resolve: ({ _id }, { size }, request, { rootValue: { relatedArtworksLoader } }) =>
        relatedArtworksLoader(null, { artwork_id: _id, size }),
    },
    sale: {
      type: Sale.type,
      resolve: ({ sale_ids }, options, request, { rootValue: { saleLoader } }) => {
        if (sale_ids && sale_ids.length > 0) {
          const sale_id = _.first(sale_ids)
          // don't error if the sale is unpublished
          return saleLoader(sale_id).catch(() => null)
        }
        return null
      },
    },
    sale_artwork: {
      type: SaleArtwork.type,
      resolve: ({ id, sale_ids }) => {
        if (sale_ids && sale_ids.length > 0) {
          const sale_id = _.first(sale_ids)
          // don't error if the sale/artwork is unpublished
          return gravity(`sale/${sale_id}/sale_artwork/${id}`).catch(() => null)
        }
        return null
      },
    },
    sale_message: {
      type: GraphQLString,
      resolve: ({ sale_message, availability, price }) => {
        if (availability === "on hold") {
          if (price) {
            return `${price}, on hold`
          }
          return "On hold"
        }
        if (availability === "not for sale") {
          return null
        }
        if (sale_message && sale_message.indexOf("Sold") > -1) {
          return "Sold"
        }
        return sale_message
      },
    },
    series: markdown(),
    show: {
      type: PartnerShow.type,
      args: {
        size: {
          type: GraphQLInt,
        },
        active: {
          type: GraphQLBoolean,
        },
        at_a_fair: {
          type: GraphQLBoolean,
        },
        sort: {
          type: PartnerShowSorts.type,
        },
      },
      resolve: ({ id }, { active, sort, at_a_fair }, request, { rootValue: { relatedShowsLoader } }) =>
        relatedShowsLoader(null, {
          artwork: [id],
          size: 1,
          active,
          sort,
          at_a_fair,
        }).then(_.first),
    },
    shows: {
      type: new GraphQLList(PartnerShow.type),
      args: {
        size: {
          type: GraphQLInt,
        },
        active: {
          type: GraphQLBoolean,
        },
        at_a_fair: {
          type: GraphQLBoolean,
        },
        sort: {
          type: PartnerShowSorts.type,
        },
      },
      resolve: ({ id }, { size, active, sort, at_a_fair }, request, { rootValue: { relatedShowsLoader } }) =>
        relatedShowsLoader(null, {
          artwork: [id],
          active,
          size,
          sort,
          at_a_fair,
        }),
    },
    signature: markdown(({ signature }) => signature.replace(/^signature:\s+/i, "")),
    title: {
      type: GraphQLString,
      resolve: ({ title }) => (_.isEmpty(title) ? "Untitled" : title),
    },
    to_s: {
      type: GraphQLString,
      resolve: ({ artist, title, date, partner }) => {
        return _.compact([artist && artist.name, title && `‘${title}’`, date, partner && partner.name]).join(", ")
      },
    },
    website: {
      type: GraphQLString,
      resolve: artwork => (isEmbeddedVideo(artwork) ? null : artwork.website),
    },
  }
}

export const ArtworkType = new GraphQLObjectType({
  name: "Artwork",
  interfaces: [NodeInterface],
  isTypeOf: obj => _.has(obj, "title") && _.has(obj, "artists"),
  fields: () => {
    return {
      ...artworkFields(),
      cached,
    }
  },
})

Artwork = {
  type: ArtworkType,
  description: "An Artwork",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Artwork",
    },
  },
  resolve: (root, { id }, request, { rootValue: { artworkLoader } }) => artworkLoader(id),
}

export default Artwork

export const artworkConnection = connectionDefinitions({
  nodeType: Artwork.type,
}).connectionType
