import _ from "lodash"
import { isTwoDimensional, isTooBig, isEmbeddedVideo, embed } from "./utilities"
import { enhance, existyValue } from "lib/helpers"
import cached from "schema/v1/fields/cached"
import { markdown } from "schema/v1/fields/markdown"
import Article from "schema/v1/article"
import Artist from "schema/v1/artist"
import Image, { getDefault, normalizeImageData } from "schema/v1/image"
import { setVersion } from "schema/v1/image/normalize"
import Fair from "schema/v1/fair"
import Sale from "schema/v1/sale"
import SaleArtwork from "schema/v1/sale_artwork"
import { connectionWithCursorInfo } from "schema/v1/fields/pagination"
import PartnerShow from "schema/v1/partner_show"
import PartnerShowSorts from "schema/v1/sorts/partner_show_sorts"
import Partner from "schema/v1/partner"
import Context from "./context"
import Meta, { artistNames } from "./meta"
import Highlight from "./highlight"
import Dimensions from "schema/v1/dimensions"
import EditionSet, { EditionSetSorts } from "schema/v1/edition_set"
import { Sellable } from "schema/v1/sellable"
import { Searchable } from "schema/v1/searchable"
import ArtworkLayer from "./layer"
import ArtworkLayers, { artworkLayers } from "./layers"
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
  GraphQLFloat,
} from "graphql"
import AttributionClass from "schema/v1/artwork/attributionClass"
// Mapping of attribution_class ids to AttributionClass values
import attributionClasses from "lib/attributionClasses"
import { LotStandingType } from "../me/lot_standing"
import { symbolFromCurrencyCode, amount } from "schema/v1/fields/money"
import { capitalizeFirstCharacter } from "lib/helpers"
import artworkPageviews from "data/weeklyArtworkPageviews.json"
import { ResolverContext } from "types/graphql"
import { listPrice } from "schema/v1/fields/listPrice"
import { deprecate } from "lib/deprecation"
import Show from "schema/v1/show"
import ShowSort from "schema/v1/sorts/show_sort"
import { ArtworkContextGrids } from "./artworkContextGrids"

const has_price_range = (price) => {
  return new RegExp(/\-/).test(price)
}

const has_multiple_editions = (edition_sets) => {
  return edition_sets && edition_sets.length > 1
}

const formattedMetadata = {
  type: GraphQLString,
  description:
    "Formatted artwork metadata, including artist, title, date and partner; e.g., 'Andy Warhol, Truck, 1980, Westward Gallery'.",
  resolve: ({ artist, title, date, partner }) => {
    return _.compact([
      artist && artist.name,
      title && `‘${title}’`,
      date,
      partner && partner.name,
    ]).join(", ")
  },
}

export const ArtworkType = new GraphQLObjectType<any, ResolverContext>({
  name: "Artwork",
  interfaces: [NodeInterface, Searchable, Sellable],
  fields: () => {
    return {
      ...SlugAndInternalIDFields,
      cached,
      additional_information: markdown(),
      artist: {
        type: Artist.type,
        args: {
          shallow: {
            type: GraphQLBoolean,
            description:
              "Use whatever is in the original response instead of making a request",
          },
        },
        resolve: ({ artist }, { shallow }, { artistLoader }) => {
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
            description:
              "Use whatever is in the original response instead of making a request",
          },
        },
        resolve: ({ artists }, { shallow }, { artistLoader }) => {
          if (shallow) return artists
          return Promise.all(
            artists.map((artist) => artistLoader(artist.id))
          ).catch(() => [])
        },
      },
      artist_names: {
        type: GraphQLString,
        resolve: (artwork) => artistNames(artwork),
      },
      articles: {
        type: new GraphQLList(Article.type),
        args: { size: { type: GraphQLInt } },
        resolve: ({ _id }, { size }, { articlesLoader }) =>
          articlesLoader({
            artwork_id: _id,
            published: true,
            limit: size,
          }).then(({ results }) => results),
      },
      availability: { type: GraphQLString },
      can_share_image: {
        type: GraphQLBoolean,
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "is_*",
        }),
      },
      category: {
        type: GraphQLString,
        description:
          'Represents the "**medium type**", such as _Painting_. (This field is also commonly referred to as just "medium", but should not be confused with the artwork attribute called `medium`.)',
      },
      attribution_class: {
        type: AttributionClass,
        description:
          'Represents the "**classification**" of an artwork, such as _limited edition_',
        resolve: ({ attribution_class }) => {
          if (attribution_class) {
            return attributionClasses[attribution_class]
          }
        },
      },
      collecting_institution: {
        type: GraphQLString,
        resolve: ({ collecting_institution }) =>
          existyValue(collecting_institution),
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
        resolve: ({ partner, availability_hidden, availability }) => {
          if (partner && partner.type === "Auction") {
            return [
              "Hello, I am interested in placing a bid on this work.",
              "Please send me more information.",
            ].join(" ")
          }
          if (availability_hidden) {
            return null
          }
          if (availability === "sold" || availability === "on loan") {
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
      contextGrids: ArtworkContextGrids,
      cultural_maker: { type: GraphQLString },
      date: { type: GraphQLString },
      description: markdown(({ blurb }) => blurb),
      dimensions: Dimensions,
      embed: {
        type: GraphQLString,
        description:
          "Returns an HTML string representing the embedded content (video)",
        args: {
          width: { type: GraphQLInt, defaultValue: 853 },
          height: { type: GraphQLInt, defaultValue: 450 },
          autoplay: { type: GraphQLBoolean, defaultValue: false },
        },
        resolve: ({ website, category }, options: any) =>
          isEmbeddedVideo({ website, category })
            ? embed(website, options)
            : null,
      },
      edition_of: {
        type: GraphQLString,
        resolve: ({ unique, edition_sets }) => {
          if (unique) return "Unique"
          if (edition_sets && edition_sets.length === 1) {
            return edition_sets[0]!.editions
          }
        },
      },
      edition_sets: {
        type: new GraphQLList(EditionSet.type),
        args: { sort: EditionSetSorts },
        resolve: ({ edition_sets }, { sort }) => {
          if (sort) {
            // Only ascending price sort supported currently.
            return edition_sets.sort(
              ({ price_cents: aPrice }, { price_cents: bPrice }) => {
                if (!aPrice || aPrice.length === 0) {
                  return 1
                } else if (!bPrice || bPrice.length === 0) {
                  return -1
                } else {
                  return aPrice[0] - bPrice[0]
                }
              }
            )
          }
          return edition_sets
        },
      },
      exhibition_history: markdown(),
      fair: {
        type: Fair.type,
        resolve: ({ id }, _options, { relatedFairsLoader }) => {
          return relatedFairsLoader({
            artwork: [id],
            size: 1,
          }).then(_.first)
        },
      },
      formattedMetadata,
      height: {
        type: GraphQLString, // See note on `metric` field.
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "dimensions",
        }),
      },
      highlights: {
        type: new GraphQLList(Highlight),
        description: "Returns the highlighted shows and articles",
        resolve: (
          { id, _id },
          _options,
          { relatedShowsLoader, articlesLoader }
        ) =>
          Promise.all([
            relatedShowsLoader({
              artwork: [id],
              size: 1,
              at_a_fair: false,
            }),
            articlesLoader({
              artwork_id: _id,
              published: true,
              limit: 1,
            }).then(({ results }) => results),
          ]).then(([{ body: shows }, articles]) => {
            const highlightedShows = enhance(shows, {
              highlight_type: "Show",
            })
            const highlightedArticles = enhance(articles, {
              highlight_type: "Article",
            })
            return highlightedShows.concat(highlightedArticles)
          }),
      },
      href: { type: GraphQLString, resolve: ({ id }) => `/artwork/${id}` },
      image: {
        type: Image.type,
        resolve: ({ images }) => {
          return normalizeImageData(getDefault(images))
        },
      },
      imageUrl: {
        type: GraphQLString,
        resolve: ({ images }) => setVersion(getDefault(images), ["square"]),
      },
      image_rights: { type: GraphQLString },
      image_title: {
        type: GraphQLString,
        resolve: ({ artist, title, date }) => {
          return _.compact([
            artist && artist.name,
            title && `‘${title}’`,
            date,
          ]).join(", ")
        },
      },
      images: {
        type: new GraphQLList(Image.type),
        args: { size: { type: GraphQLInt } },
        resolve: ({ images }, { size }) => {
          const sorted = _.sortBy(images, "position")
          return normalizeImageData(size ? _.take(sorted, size) : sorted)
        },
      },
      inventoryId: {
        type: GraphQLString,
        description: "Private text field for partner use",
        resolve: ({ inventory_id }) => inventory_id,
      },
      is_acquireable: {
        type: GraphQLBoolean,
        description: "Whether a work can be purchased through e-commerce",
        resolve: ({ acquireable }) => acquireable,
      },
      is_offerable: {
        type: GraphQLBoolean,
        description: "Whether a user can make an offer on a work",
        resolve: ({ offerable }) => offerable,
      },
      is_biddable: {
        type: GraphQLBoolean,
        description:
          "Is this artwork part of an auction that is currently running?",
        resolve: ({ sale_ids }, _options, { salesLoader }) => {
          if (sale_ids && sale_ids.length > 0) {
            return salesLoader({
              id: sale_ids,
              is_auction: true,
              live: true,
            }).then((sales) => {
              return sales.length > 0
            })
          }
          return false
        },
      },
      is_buy_nowable: {
        type: GraphQLBoolean,
        description: "When in an auction, can the work be bought immediately",
        resolve: ({ acquireable, sale_ids }, _options, { salesLoader }) => {
          if (sale_ids && sale_ids.length > 0 && acquireable) {
            return salesLoader({
              id: sale_ids,
              is_auction: true,
              live: true,
            }).then((sales) => {
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
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "is_inquireable",
        }),
        resolve: (artwork, _options, { relatedSalesLoader }) => {
          return relatedSalesLoader({
            size: 1,
            active: true,
            artwork: [artwork.id],
          })
            .then((sales) => {
              return (
                artwork.forsale &&
                !_.isEmpty(artwork.partner) &&
                !artwork.acquireable &&
                !sales.length
              )
            })
            .catch(() => false)
        },
      },
      is_downloadable: {
        type: GraphQLBoolean,
        resolve: ({ images }) => !!(_.first(images) && images[0].downloadable),
      },
      is_embeddable_video: { type: GraphQLBoolean, resolve: isEmbeddedVideo },
      is_ecommerce: {
        type: GraphQLBoolean,
        deprecationReason: deprecate({
          inVersion: 2,
          reason: "Should not be used to determine anything UI-level.",
        }),
        resolve: ({ ecommerce }) => ecommerce,
      },
      is_for_sale: { type: GraphQLBoolean, resolve: ({ forsale }) => forsale },
      is_hangable: {
        type: GraphQLBoolean,
        resolve: (artwork) => {
          const is3D =
            _.includes(artwork.category, "sculpture") ||
            _.includes(artwork.category, "installation") ||
            _.includes(artwork.category, "design")

          return !is3D && isTwoDimensional(artwork) && !isTooBig(artwork)
        },
      },
      is_inquireable: {
        type: GraphQLBoolean,
        description: "Do we want to encourage inquiries on this work?",
        resolve: ({ inquireable }) => inquireable,
      },
      is_in_auction: {
        type: GraphQLBoolean,
        description: "Is this artwork part of an auction?",
        resolve: ({ sale_ids }, _options, { salesLoader }) => {
          if (sale_ids && sale_ids.length > 0) {
            return salesLoader({
              id: sale_ids,
              is_auction: true,
            }).then((sales) => {
              return sales.length > 0
            })
          }
          return false
        },
      },
      is_in_show: {
        type: GraphQLBoolean,
        description: "Is this artwork part of a current show",
        resolve: ({ id }, _options, { relatedShowsLoader }) =>
          relatedShowsLoader({ active: true, size: 1, artwork: [id] }).then(
            ({ body: shows }) => shows.length > 0
          ),
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
        resolve: ({ price, edition_sets }) =>
          has_price_range(price) && !has_multiple_editions(edition_sets),
      },
      is_purchasable: {
        type: GraphQLBoolean,
        deprecationReason: deprecate({
          inVersion: 2,
          reason: "Purchase requests are not supported. Replaced by buy now.",
        }),
        resolve: () => null,
      },
      is_saved: {
        type: GraphQLBoolean,
        resolve: ({ id }, {}, { savedArtworkLoader }) => {
          if (!savedArtworkLoader) return false
          return savedArtworkLoader(id).then(({ is_saved }) => is_saved)
        },
      },
      is_shareable: {
        type: GraphQLBoolean,
        resolve: ({ can_share_image }) => can_share_image,
      },
      is_sold: { type: GraphQLBoolean, resolve: ({ sold }) => sold },
      is_unique: { type: GraphQLBoolean, resolve: ({ unique }) => unique },
      displayLabel: { type: GraphQLString, resolve: ({ title }) => title },
      layer: {
        type: ArtworkLayer.type,
        args: { id: { type: GraphQLString } },
        resolve: (artwork, { id }, { relatedLayersLoader }) =>
          artworkLayers(artwork.id, relatedLayersLoader).then((layers) =>
            !!id ? _.find(layers, { id }) : _.first(layers)
          ),
      },
      layers: {
        type: ArtworkLayers.type,
        resolve: ({ id }, _options, { relatedLayersLoader }) =>
          artworkLayers(id, relatedLayersLoader),
      },
      literature: markdown(({ literature }) =>
        literature.replace(/^literature:\s+/i, "")
      ),
      manufacturer: markdown(),
      medium: {
        type: GraphQLString,
        description:
          'Represents the **materials** used in this work, such as _oil and acrylic on canvas_. (This should not be confused with the artwork attribute called `category`, which is commonly referred to as "medium" or "medium type")',
      },
      metric: {
        type: GraphQLString, // Used for Eigen compatibility, see conversation at: https://github.com/artsy/metaphysics/pull/1350
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "dimensions",
        }),
      },
      meta: Meta,
      myLotStanding: {
        type: new GraphQLList(new GraphQLNonNull(LotStandingType)),
        args: { live: { type: GraphQLBoolean, defaultValue: null } },
        resolve: ({ id }, { live }, { lotStandingLoader }) => {
          if (!lotStandingLoader) return null
          return lotStandingLoader({ artwork_id: id, live })
        },
      },
      pageviews: {
        type: GraphQLInt,
        description: "[DO NOT USE] Weekly pageview data (static).",
        deprecationReason: deprecate({
          inVersion: 2,
          reason: "This is for an AB test and will be imminently deprecated.",
        }),
        resolve: ({ _id }) => artworkPageviews[_id],
      },
      partner: {
        type: Partner.type,
        args: {
          shallow: {
            type: GraphQLBoolean,
            description:
              "Use whatever is in the original response instead of making a request",
          },
        },
        resolve: ({ partner }, { shallow }, { partnerLoader }) => {
          if (shallow) return partner
          if (_.isEmpty(partner)) return null
          return partnerLoader(partner.id).catch(() => null)
        },
      },
      pickup_available: { type: GraphQLBoolean },
      price: {
        type: GraphQLString,
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "listPrice",
        }),
      },
      priceCents: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "listPrice",
        }),
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "PriceCents",
          fields: {
            min: {
              type: GraphQLInt,
            },
            max: {
              type: GraphQLInt,
            },
            exact: {
              type: GraphQLBoolean,
            },
          },
        }),
        resolve: ({ price_cents }) => {
          if (!price_cents || price_cents.length === 0) {
            return null
          }
          const isExactPrice = price_cents.length === 1
          return {
            exact: isExactPrice,
            min: price_cents[0],
            max: isExactPrice ? price_cents[0] : price_cents[1],
          }
        },
      },
      listPrice,
      price_currency: { type: GraphQLString },
      priceIncludesTax: {
        type: GraphQLBoolean,
        resolve: ({ price_includes_tax }) => price_includes_tax,
      },
      priceIncludesTaxDisplay: {
        type: GraphQLString,
        resolve: ({ price_includes_tax }) => {
          return price_includes_tax ? "VAT included in price" : null
        },
      },
      shipsToContinentalUSOnly: {
        type: GraphQLBoolean,
        description:
          "Is this work available for shipping only within the Contenental US?",
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "onlyShipsDomestically",
        }),
        resolve: (artwork) => {
          return Boolean(
            artwork.domestic_shipping_fee_cents &&
              artwork.international_shipping_fee_cents == null
          )
        },
      },
      onlyShipsDomestically: {
        type: GraphQLBoolean,
        description: "Is this work only available for shipping domestically?",
        resolve: (artwork) => {
          return Boolean(
            artwork.domestic_shipping_fee_cents &&
              artwork.international_shipping_fee_cents == null
          )
        },
      },
      shippingInfo: {
        type: GraphQLString,
        description:
          "The string that describes domestic and international shipping.",
        resolve: (artwork) => {
          if (
            artwork.domestic_shipping_fee_cents == null &&
            artwork.international_shipping_fee_cents == null
          )
            return "Shipping, tax, and additional fees quoted by seller"
          if (
            artwork.domestic_shipping_fee_cents === 0 &&
            artwork.international_shipping_fee_cents == null
          )
            return "Free domestic shipping only"
          if (
            artwork.domestic_shipping_fee_cents === 0 &&
            artwork.international_shipping_fee_cents === 0
          )
            return "Free shipping worldwide"

          let domesticShipping = amount(
            ({ domestic_shipping_fee_cents }) =>
              domestic_shipping_fee_cents || null
          ).resolve(artwork, {
            precision: 0,
            symbol: symbolFromCurrencyCode(artwork.price_currency),
          })

          let internationalShipping = amount(
            ({ international_shipping_fee_cents }) =>
              international_shipping_fee_cents || null
          ).resolve(artwork, {
            precision: 0,
            symbol: symbolFromCurrencyCode(artwork.price_currency),
          })

          if (
            domesticShipping &&
            artwork.international_shipping_fee_cents == null
          )
            return "Shipping: " + domesticShipping + " domestic only"

          if (artwork.domestic_shipping_fee_cents === 0)
            domesticShipping = "Free"
          if (artwork.international_shipping_fee_cents === 0)
            internationalShipping = "free"

          return (
            "Shipping: " +
            domesticShipping +
            " domestic, " +
            internationalShipping +
            " rest of world"
          )
        },
      },
      shippingOrigin: {
        type: GraphQLString,
        description:
          "Minimal location information describing from where artwork will be shipped.",
        resolve: (artwork) => {
          return artwork.shipping_origin && artwork.shipping_origin.join(", ")
        },
      },
      shippingCountry: {
        type: GraphQLString,
        description: "The country an artwork will be shipped from.",
        resolve: (artwork) => {
          return (
            artwork.shipping_origin &&
            artwork.shipping_origin[artwork.shipping_origin.length - 1]
          )
        },
      },
      provenance: markdown(({ provenance }) =>
        provenance.replace(/^provenance:\s+/i, "")
      ),
      publisher: markdown(),
      related: {
        type: new GraphQLList(Artwork.type),
        args: { size: { type: GraphQLInt } },
        resolve: ({ _id }, { size }, { relatedArtworksLoader }) =>
          relatedArtworksLoader({ artwork_id: _id, size }),
      },
      sale: {
        type: Sale.type,
        resolve: ({ sale_ids }, _options, { saleLoader }) => {
          if (sale_ids && sale_ids.length > 0) {
            const sale_id = sale_ids[0]
            // don't error if the sale is unpublished
            return saleLoader(sale_id).catch(() => null)
          }
          return null
        },
      },
      sale_artwork: {
        type: SaleArtwork.type,
        args: { sale_id: { type: GraphQLString, defaultValue: null } },
        resolve: ({ id, sale_ids }, { sale_id }, { saleArtworkLoader }) => {
          // Note that we don't even try to call the saleArtworkLoader unless there's
          // at least one element in sale_ids.
          if (sale_ids && sale_ids.length > 0) {
            const loader_sale_id = sale_id || _.first(sale_ids)
            // don't error if the sale/artwork is unpublished
            return saleArtworkLoader({
              saleId: loader_sale_id,
              saleArtworkId: id,
            }).catch(() => null)
          }
          return null
        },
      },
      sale_message: {
        type: GraphQLString,
        resolve: ({
          sale_message,
          availability,
          availability_hidden,
          price,
        }) => {
          // Don't display anything if availability is hidden, or artwork is not for sale.
          if (availability_hidden || availability === "not for sale") {
            return null
          }

          // If permanent collection, on loan or sold, just return those, do not include price.
          if (availability === "permanent collection") {
            return "Permanent collection"
          }
          if (availability === "on loan") {
            return "On loan"
          }
          if (sale_message && sale_message.indexOf("Sold") > -1) {
            return "Sold"
          }

          // If on hold, prepend the price (if there is one).
          if (availability === "on hold") {
            if (price) {
              return `${price}, on hold`
            }
            return "On hold"
          }

          return sale_message
        },
      },
      series: markdown(),
      show: {
        type: PartnerShow.type,
        args: {
          size: { type: GraphQLInt },
          active: { type: GraphQLBoolean },
          at_a_fair: { type: GraphQLBoolean },
          sort: { type: PartnerShowSorts.type },
        },
        resolve: (
          { id },
          { active, sort, at_a_fair },
          { relatedShowsLoader }
        ) =>
          relatedShowsLoader({
            artwork: [id],
            size: 1,
            active,
            sort,
            at_a_fair,
          })
            .then(({ body }) => body)
            .then(_.first),
      },
      v2_shows: {
        type: new GraphQLList(Show.type),
        args: {
          size: { type: GraphQLInt },
          active: { type: GraphQLBoolean },
          at_a_fair: { type: GraphQLBoolean },
          sort: { type: ShowSort },
        },
        resolve: (
          { id },
          { size, active, sort, at_a_fair },
          { relatedShowsLoader }
        ) => {
          return relatedShowsLoader({
            artwork: [id],
            active,
            size,
            sort,
            at_a_fair,
          }).then(({ body }) => {
            return body
          })
        },
      },
      shows: {
        type: new GraphQLList(PartnerShow.type),
        args: {
          size: { type: GraphQLInt },
          active: { type: GraphQLBoolean },
          at_a_fair: { type: GraphQLBoolean },
          sort: { type: PartnerShowSorts.type },
        },
        resolve: (
          { id },
          { size, active, sort, at_a_fair },
          { relatedShowsLoader }
        ) =>
          relatedShowsLoader({
            artwork: [id],
            active,
            size,
            sort,
            at_a_fair,
          }).then(({ body }) => body),
      },
      signature: markdown(({ signature }) =>
        signature.replace(/^signature:\s+/i, "")
      ),
      title: {
        type: GraphQLString,
        resolve: ({ title }) => (_.isEmpty(title) ? "Untitled" : title),
      },
      to_s: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "formattedMetadata",
        }),
        ...formattedMetadata,
      },
      published: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: "Whether this Artwork is Published of not",
      },
      website: {
        type: GraphQLString,
        description:
          "If the category is video, then it returns the href for the (youtube/vimeo) video, otherwise returns the website from CMS",
        resolve: (artwork) =>
          isEmbeddedVideo(artwork) ? null : artwork.website,
      },
      width: {
        type: GraphQLString, // See note on `metric` field.
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "dimensions",
        }),
      },
      framed: {
        type: ArtworkInfoRowType,
        resolve: ({ framed }) => {
          if (framed) {
            return { label: "Framed", details: "Included" }
          } else if (framed === false) {
            return { label: "Framed", details: "Not included" }
          } else {
            return null
          }
        },
      },
      signatureInfo: {
        type: ArtworkInfoRowType,
        resolve: ({
          signature,
          signed_by_artist,
          stamped_by_artist_estate,
          sticker_label,
          signed_other,
          not_signed,
        }) => {
          const detailsParts: string[] = []
          if (signed_by_artist) {
            detailsParts.push("hand-signed by artist")
          }
          if (stamped_by_artist_estate) {
            detailsParts.push("stamped by artist's estate")
          }
          if (sticker_label) {
            detailsParts.push("sticker label")
          }
          if (signature && signature.length > 0) {
            detailsParts.push(signature)
          }
          if (not_signed) {
            detailsParts.push("not signed")
          }
          if (detailsParts.length === 0 && !signed_other) {
            return null
          }
          return {
            label: "Signature",
            details: capitalizeFirstCharacter(detailsParts.join(", ")),
          }
        },
      },
      conditionDescription: {
        type: ArtworkInfoRowType,
        resolve: ({ condition_description }) => {
          if (!condition_description || condition_description.length === 0) {
            return null
          }
          return {
            label: "Condition details",
            details: capitalizeFirstCharacter(condition_description),
          }
        },
      },
      hasCertificateOfAuthenticity: {
        type: GraphQLBoolean,
        description:
          "Returns true when artwork has a certificate of authenticity",
        resolve: ({ certificate_of_authenticity }) =>
          certificate_of_authenticity === true,
      },
      certificateOfAuthenticity: {
        type: ArtworkInfoRowType,
        description:
          "Returns the display label and detail for artwork certificate of authenticity",
        resolve: ({ certificate_of_authenticity }) => {
          if (certificate_of_authenticity) {
            return { label: "Certificate of authenticity", details: "Included" }
          } else if (certificate_of_authenticity === false) {
            return {
              label: "Certificate of authenticity",
              details: "Not included",
            }
          } else {
            return null
          }
        },
      },
      widthCm: {
        description:
          "If you need to render artwork dimensions as a string, prefer the `Artwork#dimensions` field",
        type: GraphQLFloat,
        resolve: ({ width_cm }) => width_cm,
      },
      heightCm: {
        description:
          "If you need to render artwork dimensions as a string, prefer the `Artwork#dimensions` field",
        type: GraphQLFloat,
        resolve: ({ height_cm }) => height_cm,
      },
      sizeScore: {
        description: "score assigned to an artwork based on its dimensions",
        type: GraphQLFloat,
        resolve: ({ size_score }) => size_score,
      },
    }
  },
})

const ArtworkInfoRowType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkInfoRow",
  fields: {
    label: {
      type: GraphQLString,
      description: "Label for information row",
    },
    details: {
      type: GraphQLString,
      description: "Additional details about given attribute",
    },
  },
})

const Artwork: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtworkType,
  description: "An Artwork",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Artwork",
    },
  },
  resolve: (_source, { id }, { artworkLoader }) => {
    return artworkLoader(id)
  },
}

export default Artwork

export const artworkConnection = connectionWithCursorInfo(ArtworkType)
