import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  Money,
  resolveMinorAndCurrencyFieldsToMoney,
} from "schema/v2/fields/money"

// A point-in-time snapshot of an artwork as included in a published private
// viewing room (Gravity's PartnerListPublicationArtwork#visible_json) — not
// the live Artwork type, since fields here are pinned as of the room's last
// publish and only include whatever the gallery has toggled visible.
export const PrivateViewingRoomArtworkType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PrivateViewingRoomArtwork",
  fields: () => ({
    artworkID: {
      type: GraphQLString,
      resolve: ({ artwork_id }) => artwork_id,
    },
    imageURL: {
      type: GraphQLString,
      resolve: ({ image_url }) => image_url,
    },
    artistName: {
      type: GraphQLString,
      resolve: ({ artist_name }) => artist_name,
    },
    artworkTitle: {
      type: GraphQLString,
      resolve: ({ artwork_title }) => artwork_title,
    },
    year: {
      type: GraphQLString,
    },
    medium: {
      type: GraphQLString,
    },
    dimensions: {
      type: GraphQLString,
    },
    priceCents: {
      type: GraphQLInt,
      resolve: ({ price_cents }) => price_cents,
    },
    priceCurrency: {
      type: GraphQLString,
      resolve: ({ price_currency }) => price_currency,
    },
    price: {
      type: Money,
      description:
        "The pinned price as a formatted Money object. Null when there's no pinned price " +
        "or currency (resolveMinorAndCurrencyFieldsToMoney returns null rather than throwing).",
      resolve: (
        { price_cents: minor, price_currency: currencyCode },
        args,
        context,
        info
      ) => {
        if (minor == null || !currencyCode) return null

        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          args,
          context,
          info
        )
      },
    },
    availability: {
      type: GraphQLString,
    },
    editionInfo: {
      type: GraphQLString,
      resolve: ({ edition_info }) => edition_info,
    },
    location: {
      type: GraphQLString,
      description:
        "The artwork's public location (city/state/country/postal code), pinned as of the room's last publish.",
    },
    coaByGallery: {
      type: GraphQLBoolean,
      resolve: ({ coa_by_gallery }) => coa_by_gallery,
    },
    coaByAuthenticatingBody: {
      type: GraphQLBoolean,
      resolve: ({ coa_by_authenticating_body }) => coa_by_authenticating_body,
    },
  }),
})
