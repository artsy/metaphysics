import {
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "../artwork"
import { GlobalIDField, InternalIDFields } from "../object_identification"
import { toGlobalId } from "graphql-relay"
import { ArtworkVersionType } from "../artwork_version"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../fields/money"

export const LineItemType = new GraphQLObjectType<any, ResolverContext>({
  name: "LineItem",
  description: "A line item in an order",
  fields: {
    ...InternalIDFields,

    artwork: {
      type: ArtworkType,
      resolve: ({ artwork_id }, _args, { artworkLoader }) => {
        return artworkLoader(artwork_id)
      },
    },
    artworkVersion: {
      type: ArtworkVersionType,
      resolve: (
        { artwork_version_id },
        _args,
        { authenticatedArtworkVersionLoader }
      ) =>
        authenticatedArtworkVersionLoader
          ? authenticatedArtworkVersionLoader(artwork_version_id)
          : null,
    },
    currencyCode: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ currency_code }) => currency_code,
    },
    listPrice: {
      type: Money,
      resolve: async (
        // TODO: Remove USD fallback and include currency_code in the line item json
        { list_price_cents: minor, currency_code: currencyCode = "USD" },
        _args,
        context,
        _info
      ) => {
        return resolveMinorAndCurrencyFieldsToMoney(
          {
            minor: minor,
            currencyCode,
          },
          _args,
          context,
          _info
        )
      },
    },
    quantity: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: ({ quantity }) => quantity,
    },
  },
})
