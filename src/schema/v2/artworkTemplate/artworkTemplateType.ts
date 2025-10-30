import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields } from "../object_identification"
import { markdown } from "../fields/markdown"
import { date } from "../fields/date"
import { amount } from "../fields/money"
import AttributionClass from "../artwork/attributionClass"
import { ArtworkVisibility } from "../artwork/artworkVisibility"
import attributionClasses from "lib/attributionClasses"
import Artist from "../artist"

export const ArtworkTemplateType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkTemplate",
  fields: () => ({
    ...IDFields,
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ partner_id }) => partner_id,
    },
    artistIDs: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ artist_ids }) => artist_ids || [],
    },
    artists: {
      type: new GraphQLList(Artist.type),
      args: {
        shallow: {
          type: GraphQLBoolean,
          description:
            "Use whatever is in the original response instead of making a request",
          defaultValue: false,
        },
      },
      resolve: (
        { artist_ids },
        { shallow },
        {
          unauthenticatedLoaders: { artistLoader: unauthenticatedArtistLoader },
        }
      ) => {
        if (!artist_ids || artist_ids.length === 0) return []
        if (shallow) return artist_ids.map((id) => ({ id, _id: id }))

        return Promise.all(
          artist_ids.map((id) => unauthenticatedArtistLoader(id))
        ).catch(() => [])
      },
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
    attributionClass: {
      type: AttributionClass,
      resolve: ({ attribution_class }) => {
        if (attribution_class) {
          return attributionClasses[attribution_class]
        }
      },
    },
    availability: {
      type: GraphQLString,
    },
    category: {
      type: GraphQLString,
    },
    certificateOfAuthenticity: {
      type: GraphQLBoolean,
      resolve: ({ certificate_of_authenticity }) => certificate_of_authenticity,
    },
    coaByAuthenticatingBody: {
      type: GraphQLBoolean,
      resolve: ({ coa_by_authenticating_body }) => coa_by_authenticating_body,
    },
    coaByGallery: {
      type: GraphQLBoolean,
      resolve: ({ coa_by_gallery }) => coa_by_gallery,
    },
    conditionDescription: {
      type: GraphQLString,
      resolve: ({ condition_description }) => condition_description,
    },
    date: {
      type: GraphQLString,
    },
    depth: {
      type: GraphQLFloat,
    },
    diameter: {
      type: GraphQLFloat,
    },
    displayPriceRange: {
      type: GraphQLBoolean,
      resolve: ({ display_price_range }) => display_price_range,
    },
    duration: {
      type: GraphQLFloat,
    },
    ecommerce: {
      type: GraphQLBoolean,
    },
    isFramed: {
      type: GraphQLBoolean,
      resolve: ({ framed }) => framed,
    },
    framedDepth: {
      type: GraphQLFloat,
      resolve: ({ framed_depth }) => framed_depth,
    },
    framedDiameter: {
      type: GraphQLFloat,
      resolve: ({ framed_diameter }) => framed_diameter,
    },
    framedHeight: {
      type: GraphQLFloat,
      resolve: ({ framed_height }) => framed_height,
    },
    framedMetric: {
      type: GraphQLString,
      resolve: ({ framed_metric }) => framed_metric,
    },
    framedWidth: {
      type: GraphQLFloat,
      resolve: ({ framed_width }) => framed_width,
    },
    height: {
      type: GraphQLFloat,
    },
    manufacturer: markdown(),
    medium: {
      type: GraphQLString,
    },
    metric: {
      type: GraphQLString,
    },
    isNotSigned: {
      type: GraphQLBoolean,
      resolve: ({ not_signed }) => not_signed,
    },
    isOfferable: {
      type: GraphQLBoolean,
      resolve: ({ offer }) => offer,
    },
    isPickupAvailable: {
      type: GraphQLBoolean,
      resolve: ({ pickup_available }) => pickup_available,
    },
    priceCurrency: {
      type: GraphQLString,
      resolve: ({ price_currency }) => price_currency,
    },
    isPriceHidden: {
      type: GraphQLBoolean,
      resolve: ({ price_hidden }) => price_hidden,
    },
    priceListed: {
      ...amount(({ price_listed }) => price_listed),
    },
    priceMax: {
      ...amount(({ price_max }) => price_max),
    },
    priceMin: {
      ...amount(({ price_min }) => price_min),
    },
    publisher: markdown(),
    series: markdown(),
    shippingNotes: {
      type: GraphQLString,
      resolve: ({ shipping_notes }) => shipping_notes,
    },
    shippingWeight: {
      type: GraphQLFloat,
      resolve: ({ shipping_weight }) => shipping_weight,
    },
    shippingWeightMetric: {
      type: GraphQLString,
      resolve: ({ shipping_weight_metric }) => shipping_weight_metric,
    },
    signature: markdown(({ signature }) =>
      signature?.replace(/^signature:\s+/i, "")
    ),
    isSignedByArtist: {
      type: GraphQLBoolean,
      resolve: ({ signed_by_artist }) => signed_by_artist,
    },
    isSignedInPlate: {
      type: GraphQLBoolean,
      resolve: ({ signed_in_plate }) => signed_in_plate,
    },
    isSignedOther: {
      type: GraphQLBoolean,
      resolve: ({ signed_other }) => signed_other,
    },
    isStampedByArtistEstate: {
      type: GraphQLBoolean,
      resolve: ({ stamped_by_artist_estate }) => stamped_by_artist_estate,
    },
    isStickerLabel: {
      type: GraphQLBoolean,
      resolve: ({ sticker_label }) => sticker_label,
    },
    tags: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ tags }) => tags || [],
    },
    isUnique: {
      type: GraphQLBoolean,
      resolve: ({ unique }) => unique,
    },
    visibilityLevel: {
      type: ArtworkVisibility,
      resolve: ({ visibility_level }) => visibility_level,
    },
    website: {
      type: GraphQLString,
    },
    width: {
      type: GraphQLFloat,
    },
    domesticShippingFeeCents: {
      type: GraphQLInt,
      resolve: ({ domestic_shipping_fee_cents }) => domestic_shipping_fee_cents,
    },
    internationalShippingFeeCents: {
      type: GraphQLInt,
      resolve: ({ international_shipping_fee_cents }) =>
        international_shipping_fee_cents,
    },
    createdAt: date(({ created_at }) => created_at),
    updatedAt: date(({ updated_at }) => updated_at),
  }),
})
