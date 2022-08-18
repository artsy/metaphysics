import config from "config"
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { PageInfoType } from "graphql-relay"
// Mapping of category ids to MediumType values
import artworkMediums from "lib/artworkMediums"
// Mapping of attribution_class ids to AttributionClass values
import attributionClasses from "lib/attributionClasses"
import { deprecate } from "lib/deprecation"
import { enrichArtworksWithPriceInsights } from "lib/fillers/enrichArtworksWithPriceInsights"
import { formatLargeNumber } from "lib/formatLargeNumber"
import { capitalizeFirstCharacter, enhance, existyValue } from "lib/helpers"
import { isFieldRequested } from "lib/ifFieldRequested"
import { priceDisplayText, priceRangeDisplayText } from "lib/moneyHelpers"
import _ from "lodash"
import Article from "schema/v2/article"
import Artist from "schema/v2/artist"
import ArtworkMedium from "schema/v2/artwork/artworkMedium"
import { VIDEOS } from "schema/v2/artwork/artworkVideos"
import AttributionClass from "schema/v2/artwork/attributionClass"
import Dimensions from "schema/v2/dimensions"
import EditionSet, { EditionSetSorts } from "schema/v2/edition_set"
import Fair from "schema/v2/fair"
import cached from "schema/v2/fields/cached"
import { listPrice } from "schema/v2/fields/listPrice"
import { markdown } from "schema/v2/fields/markdown"
import { amount, Money, symbolFromCurrencyCode } from "schema/v2/fields/money"
import {
  connectionWithCursorInfo,
  PageCursorsType,
} from "schema/v2/fields/pagination"
import Image, {
  getDefault,
  ImageType,
  normalizeImageData,
} from "schema/v2/image"
import { setVersion } from "schema/v2/image/normalize"
import { LocationType } from "schema/v2/location"
import {
  NodeInterface,
  SlugAndInternalIDFields,
} from "schema/v2/object_identification"
import Partner from "schema/v2/partner"
import Sale from "schema/v2/sale"
import SaleArtwork from "schema/v2/sale_artwork"
import { Searchable } from "schema/v2/searchable"
import { Sellable } from "schema/v2/sellable"
import Show from "schema/v2/show"
import ShowSorts from "schema/v2/sorts/show_sorts"
import { VideoType } from "schema/v2/types/Video"
import { ResolverContext } from "types/graphql"
import { getMicrofunnelDataByArtworkInternalID } from "../artist/targetSupply/utils/getMicrofunnelData"
import { InquiryQuestionType } from "../inquiry_question"
import { loadSubmissions } from "../me/loadSubmissions"
import { LotStandingType } from "../me/lot_standing"
import { myLocationType } from "../me/myLocation"
import FormattedNumber from "../types/formatted_number"
import ArtworkConsignmentSubmissionType from "./artworkConsignmentSubmissionType"
import { ArtworkContextGrids } from "./artworkContextGrids"
import { ComparableAuctionResults } from "./comparableAuctionResults"
import Context from "./context"
import { ArtworkHighlightType } from "./highlight"
import ArtworkLayer from "./layer"
import ArtworkLayers, { artworkLayers } from "./layers"
import Meta, { artistNames } from "./meta"
import { embed, isEmbeddedVideo, isTooBig, isTwoDimensional } from "./utilities"

const has_price_range = (price) => {
  return new RegExp(/-/).test(price)
}

const has_multiple_editions = (edition_sets) => {
  return edition_sets && edition_sets.length > 1
}

const IMPORT_SOURCES = {
  CONVECTION: { value: "convection" },
  MY_COLLECTION: { value: "my collection" },
} as const

export const ArtworkImportSourceEnum = new GraphQLEnumType({
  name: "ArtworkImportSource",
  values: IMPORT_SOURCES,
})

const ArtworkPriceInsightsType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkPriceInsights",
  fields: {
    artistId: {
      type: GraphQLString,
    },
    medium: {
      type: GraphQLString,
    },
    demandRank: {
      type: GraphQLFloat,
    },
    annualValueSoldCents: {
      type: FormattedNumber,
    },
    annualValueSoldDisplayText: {
      type: GraphQLString,
      description: 'The annual value of the work sold "in USD "',
      resolve: ({ annualValueSoldCents }) => {
        return `$${formatLargeNumber(annualValueSoldCents)}`
      },
    },
    annualLotsSold: {
      type: GraphQLInt,
    },
    averageSalePriceDisplayText: {
      type: GraphQLString,
      args: {
        format: {
          type: GraphQLString,
          description: "Passes in to numeral, such as `'0.00'`",
          defaultValue: "",
        },
      },
      resolve: ({ annualLotsSold, annualValueSoldCents }, { format }) => {
        if (!annualLotsSold || !annualValueSoldCents) {
          return null
        }

        return priceDisplayText(
          Math.floor((annualValueSoldCents as number) / annualLotsSold),
          "USD",
          format
        )
      },
    },
    liquidityRankDisplayText: {
      type: GraphQLString,
      args: {
        format: {
          type: GraphQLString,
          description:
            "Return the liquidity rank in a formatted way (Low, medium, high or very high)",
          defaultValue: "",
        },
      },
      resolve: ({ liquidityRank }) => {
        if (liquidityRank === null) {
          return ""
        }

        switch (true) {
          case liquidityRank < 0.25:
            return "Low"
          case liquidityRank >= 0.25 && liquidityRank < 0.7:
            return "Medium"
          case liquidityRank >= 0.7 && liquidityRank < 0.85:
            return "High"
          case liquidityRank >= 0.85:
            return "Very High"
        }

        return ""
      },
    },
    medianSalePriceDisplayText: {
      type: GraphQLString,
      args: {
        format: {
          type: GraphQLString,
          description: "Passes in to numeral, such as `'0.00'`",
          defaultValue: "",
        },
      },
      resolve: ({ medianSalePriceLast36Months }, { format }) => {
        if (!medianSalePriceLast36Months) {
          return null
        }

        return priceDisplayText(medianSalePriceLast36Months, "USD", format)
      },
    },
    lastAuctionResultDate: {
      type: GraphQLString,
    },
  },
})

export const ArtworkType = new GraphQLObjectType<any, ResolverContext>({
  name: "Artwork",
  interfaces: [NodeInterface, Searchable, Sellable],
  fields: () => {
    return {
      ...SlugAndInternalIDFields,
      cached,
      additionalInformation: markdown(
        ({ additional_information }) => additional_information
      ),
      artist: {
        type: Artist.type,
        args: {
          shallow: {
            type: GraphQLBoolean,
            description:
              "Use whatever is in the original response instead of making a request",
          },
        },
        resolve: (
          { artist },
          { shallow },
          { artistLoader, authenticatedArtistLoader }
        ) => {
          const loader = authenticatedArtistLoader || artistLoader

          if (!artist) return null
          if (shallow) return artist
          return loader(artist.id).catch(() => null)
        },
      },
      hasMarketPriceInsights: {
        type: GraphQLBoolean,
        resolve: async (
          { artist, medium, category },
          _,
          { marketPriceInsightsBatchLoader }
        ) => {
          if (!marketPriceInsightsBatchLoader) return false

          const marketPriceInsightNodes = await marketPriceInsightsBatchLoader([
            {
              artistId: artist._id,
              medium,
              category,
            },
          ])

          const hasInsights = !!marketPriceInsightNodes[0]

          return hasInsights
        },
      },
      marketPriceInsights: {
        type: ArtworkPriceInsightsType,
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
        resolve: (
          { artists },
          { shallow },
          { authenticatedArtistLoader, artistLoader }
        ) => {
          if (shallow) return artists

          const loader = authenticatedArtistLoader || artistLoader

          return Promise.all(
            artists.map((artist) => loader(artist.id))
          ).catch(() => [])
        },
      },
      artistNames: {
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
      attributionClass: {
        type: AttributionClass,
        description:
          'Represents the "**classification**" of an artwork, such as _limited edition_',
        resolve: ({ attribution_class }) => {
          if (attribution_class) {
            return attributionClasses[attribution_class]
          }
        },
      },
      importSource: {
        type: ArtworkImportSourceEnum,
        description: "Represents the import source of the artwork",
        resolve: ({ import_source }) => {
          const knownImportSources = [
            ...Object.values(IMPORT_SOURCES).map(({ value }) => value),
          ]

          if (knownImportSources.includes(import_source)) {
            return import_source
          }
        },
      },
      artworkLocation: {
        type: GraphQLString,
        resolve: (artwork) => artwork.artwork_location,
        description:
          'Represents the location of the artwork for "My Collection" artworks',
        deprecationReason: "Please use `collectorLocation` instead",
      },
      collectorLocation: {
        type: myLocationType,
        resolve: (artwork) => artwork.collector_location,
        description: "The location of the artwork in My Collection",
      },
      availability: { type: GraphQLString },
      category: {
        type: GraphQLString,
        deprecationReason: "Prefer to use `mediumType`.",
        description:
          'Represents the "**medium type**", such as _Painting_. (This field is also commonly referred to as just "medium", but should not be confused with the artwork attribute called `medium`.)',
      },
      collectingInstitution: {
        type: GraphQLString,
        resolve: ({ collecting_institution }) =>
          existyValue(collecting_institution),
      },
      comparableAuctionResults: ComparableAuctionResults,
      consignmentSubmission: {
        type: ArtworkConsignmentSubmissionType,
        resolve: async (
          { submission_id: submissionId, consignmentSubmission },
          _,
          { convectionGraphQLLoader }
        ) => {
          // If artwork already has submission information use it
          if (consignmentSubmission) return consignmentSubmission

          // Load submission by submission id in other case
          if (submissionId && convectionGraphQLLoader) {
            const submissions = await loadSubmissions(
              [submissionId],
              convectionGraphQLLoader
            )

            return submissions && submissions.length ? submissions[0] : null
          }
        },
      },
      contactLabel: {
        type: GraphQLString,
        resolve: ({ partner }) => {
          return partner.type === "Gallery" ? "Gallery" : "Seller"
        },
      },
      contactMessage: {
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
      costCurrencyCode: {
        description: "The currency code used to pay for the artwork",
        type: GraphQLString,
        resolve: ({ cost_currency_code }) => cost_currency_code,
      },
      costMinor: {
        description: "The amount paid for the artwork, in cents",
        type: GraphQLInt,
        resolve: ({ cost_minor }) => cost_minor,
      },
      culturalMaker: {
        type: GraphQLString,
        resolve: ({ cultural_maker }) => cultural_maker,
      },
      date: { type: GraphQLString },
      depth: {
        description: "The depth as expressed by the original input metric",
        type: GraphQLString,
      },
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
        // TODO: Does this replicate the intended behavior?
        resolve: ({ website, category }, options: any) =>
          isEmbeddedVideo({ website, category })
            ? embed(website, options)
            : null,
      },
      editionOf: {
        type: GraphQLString,
        resolve: ({ unique, edition_sets }) => {
          if (unique) return "Unique"
          if (edition_sets && edition_sets.length === 1) {
            return edition_sets[0]!.editions
          }
        },
      },
      isEdition: {
        type: GraphQLBoolean,
        resolve: ({ edition_sets }) => {
          return edition_sets && edition_sets.length >= 1
        },
      },
      editionSize: {
        type: GraphQLString,
        resolve: ({ edition_sets }) => edition_sets?.[0]?.edition_size,
      },
      editionNumber: {
        type: GraphQLString,
        resolve: ({ edition_sets }) =>
          edition_sets?.[0]?.available_editions?.[0],
      },
      editionSet: {
        type: EditionSet.type,
        args: { id: { type: GraphQLNonNull(GraphQLString) } },
        resolve: ({ edition_sets }, { id }) =>
          (edition_sets ?? []).find((edition) => edition.id === id),
      },
      editionSets: {
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
      exhibitionHistory: markdown(
        ({ exhibition_history }) => exhibition_history
      ),
      fair: {
        type: Fair.type,
        resolve: ({ id }, _options, { relatedFairsLoader }) => {
          return relatedFairsLoader({
            artwork: [id],
            size: 1,
          }).then(_.first)
        },
      },
      formattedMetadata: {
        type: GraphQLString,
        description:
          "Formatted artwork metadata, including artist, title, date and partner; e.g., 'Andy Warhol, Truck, 1980, Westward Gallery'.",
        resolve: ({ artist, title, date, category, medium, partner }) => {
          return _.compact([
            artist && artist.name,
            title && `‘${title}’`,
            date,
            category && category,
            medium && medium,
            partner && partner.name,
          ]).join(", ")
        },
      },
      height: {
        description: "The height as expressed by the original input metric",
        type: GraphQLString,
      },
      highlights: {
        type: new GraphQLList(ArtworkHighlightType),
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
      imageRights: {
        type: GraphQLString,
        resolve: ({ image_rights }) => image_rights,
      },
      imageTitle: {
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
      inquiryQuestions: {
        type: new GraphQLList(InquiryQuestionType),
        description:
          "Structured questions a collector can inquire on about this work",
        resolve: (
          { sale_ids, id },
          _params,
          { inquiryRequestQuestionsLoader }
        ) => {
          // Sale artworks are not inquirable
          if (!sale_ids.length) {
            return inquiryRequestQuestionsLoader({
              inquireable_id: id,
              inquireable_type: "Artwork",
            })
          }
          return []
        },
      },
      inventoryId: {
        type: GraphQLString,
        description: "Private text field for partner use",
        resolve: ({ inventory_id }) => inventory_id,
      },
      isAcquireable: {
        type: GraphQLBoolean,
        description: "Whether a work can be purchased through e-commerce",
        resolve: ({ acquireable }) => acquireable,
      },
      isOfferable: {
        type: GraphQLBoolean,
        description: "Whether a user can make an offer on a work",
        resolve: ({ offerable }) => offerable,
      },
      isOfferableFromInquiry: {
        type: GraphQLBoolean,
        description:
          "Whether a user can make an offer on the work through inquiry",
        resolve: ({ offerable_from_inquiry }) => offerable_from_inquiry,
      },
      isBiddable: {
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
      canRequestLotConditionsReport: {
        type: GraphQLBoolean,
        description:
          "Can a user request a lot conditions report for this artwork?",
        resolve: ({ sale_ids }, _options, { saleLoader }) => {
          if (sale_ids && sale_ids.length > 0) {
            const sale_id = sale_ids[0]

            return saleLoader(sale_id)
              .catch(() => false) // don't error if the sale is not found or unpublished
              .then((sale) => {
                return (
                  sale.auction_state === "open" &&
                  sale.is_auction &&
                  sale.lot_conditions_report_enabled
                )
              })
          }
          return false
        },
      },
      displayPriceRange: {
        type: GraphQLBoolean,
        resolve: ({ display_price_range }) => display_price_range,
      },
      downloadableImageUrl: {
        type: GraphQLString,
        resolve: ({ id, images }) => {
          if (!images || !images.length) return null

          const defaultImage =
            images.find((image) => image.is_default) || images[0]

          if (!defaultImage) return null

          return `${config.GRAVITY_API_BASE}/artwork/${id}/image/${defaultImage.id}/original.jpg`
        },
      },
      isBuyNowable: {
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
      isComparableWithAuctionResults: {
        type: GraphQLBoolean,
        resolve: ({ comparables_count, category }) => {
          return comparables_count > 0 && category !== "Architecture"
        },
      },
      isDownloadable: {
        type: GraphQLBoolean,
        resolve: ({ images }) => !!(_.first(images) && images[0].downloadable),
      },
      isEmbeddableVideo: { type: GraphQLBoolean, resolve: isEmbeddedVideo },
      isForSale: { type: GraphQLBoolean, resolve: ({ forsale }) => forsale },
      isHangable: {
        type: GraphQLBoolean,
        resolve: (artwork) => {
          const categories3D = [
            artworkMediums["Architecture"].id,
            artworkMediums["Books and Portfolios"].id,
            artworkMediums["Design/Decorative Art"].id,
            artworkMediums["Fashion Design and Wearable Art"].id,
            artworkMediums["Installation"].id,
            artworkMediums["Jewelry"].id,
            artworkMediums["NFT"].id,
            artworkMediums["Performance Art"].id,
            artworkMediums["Video/Film/Animation"].id,
          ]
          const categories2D = [
            artworkMediums["Drawing, Collage or other Work on Paper"].id,
            artworkMediums["Painting"].id,
            artworkMediums["Photography"].id,
            artworkMediums["Posters"].id,
            artworkMediums["Print"].id,
          ]

          const is3DCategory = categories3D.includes(artwork.category)
          const is2DCategory = categories2D.includes(artwork.category)

          // If it's in one of the 2D categories and is not humongous, it's
          // always hangable. If it's in one of the 3D categories, it's never
          // hangable. But there are some categories that _might_ be hangable:

          //   "Mixed Media"
          //   "Ephemera or Merchandise"
          //   "Sculpture"
          //   "Reproduction"
          //   "Textile arts"
          //   "Other"

          // For those categories, we check if it seems two-dimensional.
          return (
            (is2DCategory || (!is3DCategory && isTwoDimensional(artwork))) &&
            !isTooBig(artwork)
          )
        },
      },
      isInquireable: {
        type: GraphQLBoolean,
        description: "Do we want to encourage inquiries on this work?",
        resolve: ({ inquireable }) => inquireable,
      },
      isInAuction: {
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
      isInShow: {
        type: GraphQLBoolean,
        description: "Is this artwork part of a current show",
        resolve: ({ id }, _options, { relatedShowsLoader }) =>
          relatedShowsLoader({ active: true, size: 1, artwork: [id] }).then(
            ({ body: shows }) => shows.length > 0
          ),
      },
      isNotForSale: {
        type: GraphQLString,
        resolve: ({ availability }) => availability === "not for sale",
      },
      isOnHold: {
        type: GraphQLString,
        resolve: ({ availability }) => availability === "on hold",
      },
      isPriceHidden: {
        type: GraphQLBoolean,
        resolve: ({ price_hidden }) => price_hidden,
      },
      isPriceRange: {
        type: GraphQLBoolean,
        resolve: ({ price, edition_sets }) =>
          has_price_range(price) && !has_multiple_editions(edition_sets),
      },
      isSaved: {
        type: GraphQLBoolean,
        resolve: ({ _id }, {}, { savedArtworkLoader }) => {
          if (!savedArtworkLoader) return false
          return savedArtworkLoader(_id).then(({ is_saved }) => is_saved)
        },
      },
      isShareable: {
        type: GraphQLBoolean,
        resolve: ({ can_share_image }) => can_share_image,
      },
      isSold: { type: GraphQLBoolean, resolve: ({ sold }) => sold },
      isUnique: { type: GraphQLBoolean, resolve: ({ unique }) => unique },
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
      location: {
        type: LocationType,
        resolve: ({ location }) => location,
        description: "Represents partner's location",
      },
      manufacturer: markdown(),
      medium: {
        type: GraphQLString,
        description:
          'Represents the **materials** used in this work, such as _oil and acrylic on canvas_. (This should not be confused with the artwork attribute called `category`, which is commonly referred to as "medium" or "medium type")',
      },
      mediumType: {
        type: ArtworkMedium,
        description:
          'Represents the "**medium type**", such as _Painting_. (This field is also commonly referred to as just "medium", but should not be confused with the artwork attribute called `medium`.)',
        resolve: ({ category }) => {
          if (category) {
            return artworkMediums[category]
          }
        },
      },
      meta: Meta,
      metric: {
        description:
          "The unit of length of the artwork, expressed in `in` or `cm`",
        type: GraphQLString,
      },
      myLotStanding: {
        type: new GraphQLList(new GraphQLNonNull(LotStandingType)),
        args: { live: { type: GraphQLBoolean, defaultValue: null } },
        resolve: ({ id }, { live }, { lotStandingLoader }) => {
          if (!lotStandingLoader) return null
          return lotStandingLoader({ artwork_id: id, live })
        },
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
      realizedToEstimate: {
        type: GraphQLString,
        resolve: (artwork) => {
          const microfunnelArtwork = getMicrofunnelDataByArtworkInternalID(
            artwork._id
          )
          return microfunnelArtwork?.["Artwork realized / estimate multiplier"]
        },
      },
      pickupAvailable: {
        type: GraphQLBoolean,
        resolve: ({ pickup_available }) => pickup_available,
      },
      listPrice,
      price: {
        type: GraphQLString,
      },
      priceCurrency: {
        type: GraphQLString,
        resolve: ({ price_currency }) => price_currency,
      },
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
      artaShippingEnabled: {
        type: GraphQLBoolean,
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "processWithArtsyShippingDomestic",
        }),
        resolve: ({ arta_enabled }) => arta_enabled,
      },
      artsyShippingDomestic: {
        type: GraphQLBoolean,
        resolve: ({ artsy_shipping_domestic }) => artsy_shipping_domestic,
      },
      artsyShippingInternational: {
        type: GraphQLBoolean,
        resolve: ({ artsy_shipping_international }) =>
          artsy_shipping_international,
      },
      processWithArtsyShippingDomestic: {
        type: GraphQLBoolean,
        description:
          "Returns true if this work is eligible to be automatically opted into Artsy Domestic Shipping",
        resolve: ({ process_with_artsy_shipping_domestic }) =>
          process_with_artsy_shipping_domestic,
      },
      shipsToContinentalUSOnly: {
        type: GraphQLBoolean,
        description:
          "Is this work available for shipping only within the Continental US?",
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
          const domesticShippingSupported =
            artwork.domestic_shipping_fee_cents != null ||
            artwork.process_with_artsy_shipping_domestic
          const internationalShippingSupported =
            artwork.international_shipping_fee_cents != null ||
            artwork.artsy_shipping_international

          return Boolean(
            domesticShippingSupported && !internationalShippingSupported
          )
        },
      },
      domesticShippingFee: {
        type: Money,
        description: "Domestic shipping fee.",
        resolve: ({
          domestic_shipping_fee_cents: cents,
          price_currency: currency,
        }) => {
          if (typeof cents !== "number" || !currency) return null

          return { cents, currency }
        },
      },
      internationalShippingFee: {
        type: Money,
        description: "International shipping fee.",
        resolve: ({
          international_shipping_fee_cents: cents,
          price_currency: currency,
        }) => {
          if (typeof cents !== "number" || !currency) return null

          return { cents, currency }
        },
      },
      shippingInfo: {
        type: GraphQLString,
        description:
          "The string that describes domestic and international shipping.",
        resolve: (artwork) => {
          if (
            artwork.process_with_artsy_shipping_domestic ||
            artwork.artsy_shipping_international
          ) {
            return "Shipping: Calculated in checkout"
          }

          if (artwork.domestic_shipping_fee_cents == null)
            return "Shipping, tax, and additional fees quoted by seller"
          if (
            artwork.domestic_shipping_fee_cents === 0 &&
            artwork.international_shipping_fee_cents == null
          )
            return artwork.eu_shipping_origin
              ? "Free shipping within European Union only"
              : "Free domestic shipping only"

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

          const shippingRegion = artwork.eu_shipping_origin
            ? "within European Union"
            : "domestic"

          if (
            domesticShipping &&
            artwork.international_shipping_fee_cents == null
          )
            return `Shipping: ${domesticShipping} ${shippingRegion} only`

          if (artwork.domestic_shipping_fee_cents === 0)
            domesticShipping = "Free"
          if (artwork.international_shipping_fee_cents === 0)
            internationalShipping = "free"

          return `Shipping: ${domesticShipping} ${shippingRegion}, ${internationalShipping} rest of world`
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
      submissionId: {
        type: GraphQLString,
        resolve: async ({
          submission_id: submissionId,
          consignmentSubmission,
        }) => {
          return submissionId || consignmentSubmission?.id || null
        },
      },
      euShippingOrigin: {
        type: GraphQLBoolean,
        description:
          "Flags if artwork located in one of EU local shipping countries.",
        resolve: (artwork) => {
          return artwork.eu_shipping_origin
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
      vatRequirementComplete: {
        type: GraphQLBoolean,
        description:
          "Based on artwork location verify that VAT info for the partner is complete.",
        resolve: async (
          { vat_required, partner },
          {},
          { partnerAllLoader }
        ) => {
          if (vat_required == null || _.isEmpty(partner) || !partnerAllLoader)
            return null

          if (!vat_required) return true

          const { vat_status } = await partnerAllLoader(partner.id)

          return !!vat_status
        },
      },
      vatExemptApprovalRequired: {
        type: GraphQLBoolean,
        description:
          "Based on artwork location and status, verify that partner needs VAT exemption approval from Artsy.",
        resolve: async (
          { vat_required, partner },
          {},
          { partnerAllLoader }
        ) => {
          if (vat_required == null || _.isEmpty(partner) || !partnerAllLoader)
            return null

          if (!vat_required) return false

          const { vat_status, vat_exempt_approved } = await partnerAllLoader(
            partner.id
          )

          if (vat_status == null || vat_status === "registered") return false

          return !vat_exempt_approved
        },
      },
      pricePaid: {
        type: Money,
        description:
          "The price paid for the artwork in a user's 'my collection'",
        resolve: (artwork) => {
          const { price_paid_cents } = artwork
          if (!price_paid_cents && price_paid_cents !== 0) return null
          const price_paid_currency = artwork.price_paid_currency || "USD"
          return {
            cents: price_paid_cents,
            currency: price_paid_currency,
            display: amount(() => price_paid_cents).resolve(artwork, {
              precision: 0,
              symbol: symbolFromCurrencyCode(price_paid_currency),
            }),
          }
        },
      },
      provenance: markdown(({ provenance }) =>
        provenance.replace(/^provenance:\s+/i, "")
      ),
      publisher: markdown(),
      realizedPrice: {
        type: GraphQLString,
        description:
          "Price which an artwork was sold for. This generally only applies to artworks in the target supply microfunnel and (currently) queries against hardcoded spreadsheet data.",
        resolve: (artwork) => {
          const realizedPrice = getMicrofunnelDataByArtworkInternalID(
            artwork._id
          )
          return realizedPrice?.["Realized Price (in dollars)"]
        },
      },
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
      saleArtwork: {
        type: SaleArtwork.type,
        args: { saleID: { type: GraphQLString, defaultValue: null } },
        resolve: (
          { id, sale_ids },
          { saleID: sale_id },
          { saleArtworkLoader }
        ) => {
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
      saleMessage: {
        type: GraphQLString,
        resolve: ({
          sale_message,
          availability,
          availability_hidden,
          price_cents,
          price_currency,
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

          let formatted

          if (price_cents) {
            formatted =
              price_cents.length === 1
                ? priceDisplayText(price_cents[0], price_currency, "")
                : priceRangeDisplayText(
                    price_cents[0],
                    price_cents[1],
                    price_currency,
                    ""
                  )
          } else {
            formatted = sale_message
          }

          // If on hold, prepend the price (if there is one).
          if (availability === "on hold") {
            if (price_cents) {
              return `${formatted}, on hold`
            }
            return "On hold"
          }

          return formatted
        },
      },
      series: markdown(),
      show: {
        type: Show.type,
        args: {
          active: { type: GraphQLBoolean },
          atAFair: { type: GraphQLBoolean },
          sort: { type: ShowSorts },
        },
        resolve: (
          { id },
          { active, sort, atAFair: at_a_fair },
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
      shows: {
        type: new GraphQLList(Show.type),
        args: {
          size: { type: GraphQLInt },
          active: { type: GraphQLBoolean },
          atAFair: { type: GraphQLBoolean },
          sort: { type: ShowSorts },
        },
        resolve: (
          { id },
          { size, active, sort, atAFair: at_a_fair },
          { relatedShowsLoader }
        ) => {
          return relatedShowsLoader({
            artwork: [id],
            active,
            size,
            sort,
            at_a_fair,
          }).then(({ body }) => body)
        },
      },
      signature: markdown(({ signature }) =>
        signature.replace(/^signature:\s+/i, "")
      ),
      title: {
        type: GraphQLString,
        resolve: ({ title }) => (_.isEmpty(title) ? "Untitled" : title),
      },
      published: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: "Whether this artwork is published or not",
      },
      unlisted: {
        type: GraphQLBoolean,
        description: "Whether this artwork is unlisted or not",
      },
      website: {
        type: GraphQLString,
        description:
          "If the category is video, then it returns the href for the (youtube/vimeo) video, otherwise returns the website from CMS",
        resolve: (artwork) =>
          isEmbeddedVideo(artwork) ? null : artwork.website,
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
          signed_in_plate,
          stamped_by_artist_estate,
          sticker_label,
          signed_other,
          not_signed,
        }) => {
          const detailsParts: string[] = []
          if (signed_by_artist) {
            detailsParts.push("hand-signed by artist")
          }
          if (signed_in_plate) {
            detailsParts.push("signed in plate")
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
          "Returns the display label and detail when artwork has a certificate of authenticity",
        resolve: ({
          certificate_of_authenticity,
          coa_by_authenticating_body,
          coa_by_gallery,
        }) => {
          let detailsParts = ""
          if (certificate_of_authenticity) {
            detailsParts += "Included"
            if (coa_by_authenticating_body && !coa_by_gallery) {
              detailsParts += " (issued by authorized authenticating body)"
            } else if (coa_by_gallery && !coa_by_authenticating_body) {
              detailsParts += " (issued by gallery)"
            } else if (coa_by_authenticating_body && coa_by_gallery) {
              detailsParts +=
                " (one issued by gallery; one issued by authorized authenticating body)"
            }
            return {
              label: "Certificate of authenticity",
              details: detailsParts,
            }
          } else {
            return null
          }
        },
      },
      width: {
        description: "The width as expressed by the original input metric",
        type: GraphQLString,
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
      sizeBucket: {
        description:
          "size bucket assigned to an artwork based on its dimensions",
        type: GraphQLString,
        resolve: ({ size_bucket }) => size_bucket,
      },
      figures: {
        description: "A list of images and videos for the artwork",
        type: new GraphQLNonNull(
          new GraphQLList(
            new GraphQLNonNull(
              new GraphQLUnionType({
                name: "ArtworkFigures",
                types: [VideoType, ImageType],
                resolveType: ({ type }) => {
                  if (type === "Image") {
                    return ImageType
                  } else if (type === "Video") {
                    return VideoType
                  }
                },
              })
            )
          )
        ),
        resolve: ({ images, id }) => {
          const typedImages = images.map((image) => ({
            ...image,
            type: "Image",
          }))
          const sortedTypedImages = normalizeImageData(
            _.sortBy(typedImages, "position")
          )

          const typedVideos = VIDEOS[id]
            ? [{ ...VIDEOS[id], type: "Video" }]
            : []
          return [...sortedTypedImages, ...typedVideos]
        },
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
    includeUnlisted: {
      type: GraphQLBoolean,
      description: "Include unlisted artwork or not",
    },
  },
  resolve: async (
    _source,
    args,
    { artworkLoader, marketPriceInsightsBatchLoader },
    resolveInfo
  ) => {
    const { id } = args
    const gravityParams = _.mapKeys(
      _.pick(args, ["includeUnlisted"]),
      (_v, k) => _.snakeCase(k)
    )

    const hasRequestedPriceInsights = isFieldRequested(
      "marketPriceInsights",
      resolveInfo
    )

    const artwork = await artworkLoader(id, gravityParams)

    // // We don't want to query for the price insights unless the user has requested them
    if (
      marketPriceInsightsBatchLoader &&
      artwork &&
      hasRequestedPriceInsights
    ) {
      const enrichedArtworks = await enrichArtworksWithPriceInsights(
        [artwork],
        marketPriceInsightsBatchLoader
      )

      return enrichedArtworks?.[0]
    }

    return artwork
  },
}

export const ArtworkEdgeInterface = new GraphQLInterfaceType({
  name: "ArtworkEdgeInterface",
  fields: {
    node: {
      type: ArtworkType,
    },
    cursor: {
      type: GraphQLString,
    },
  },
})

export const ArtworkConnectionInterface = new GraphQLInterfaceType({
  name: "ArtworkConnectionInterface",
  fields: {
    pageCursors: { type: new GraphQLNonNull(PageCursorsType) },
    pageInfo: { type: new GraphQLNonNull(PageInfoType) },
    edges: { type: new GraphQLList(ArtworkEdgeInterface) },
  },
})

export const artworkConnection = connectionWithCursorInfo({
  nodeType: ArtworkType,
  connectionInterfaces: [ArtworkConnectionInterface],
  edgeInterfaces: [ArtworkEdgeInterface],
})

export default Artwork
