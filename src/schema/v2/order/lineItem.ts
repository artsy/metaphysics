import {
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "../artwork"
import { GlobalIDField } from "../object_identification"
import { toGlobalId } from "graphql-relay"
import { ArtworkVersionType } from "../artwork_version"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../fields/money"

export const LineItemType = new GraphQLObjectType<any, ResolverContext>({
  name: "LineItem",
  description: "A line item in an order",
  fields: {
    id: {
      ...GlobalIDField,
      resolve: ({ lineItem }, _args, _request, info) => {
        return (
          (lineItem._id && toGlobalId(info.parentType.name, lineItem._id)) ||
          (lineItem.id && toGlobalId(info.parentType.name, lineItem.id))
        )
      },
    },
    internalID: {
      description: "A type-specific ID likely used as a database ID.",
      type: new GraphQLNonNull(GraphQLID),
      resolve: ({ lineItem: { id } }) => id,
    },
    artwork: {
      type: ArtworkType,
      resolve: ({ lineItem: { artwork_id } }, _args, { artworkLoader }) => {
        return artworkLoader(artwork_id)
      },
    },
    artworkVersion: {
      type: ArtworkVersionType,
      resolve: (
        { lineItem: { artwork_version_id } },
        _args,
        { authenticatedArtworkVersionLoader }
      ) =>
        authenticatedArtworkVersionLoader
          ? authenticatedArtworkVersionLoader(artwork_version_id)
          : null,
    },
    listPrice: {
      type: Money,
      resolve: async (
        // TODO: Remove USD fallback and include currency_code in the line item json
        {
          lineItem: {
            list_price_cents: minor,
            currency_code: currencyCode = "USD",
          },
        },
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
      resolve: ({ lineItem: { quantity } }) => quantity,
    },
  },
})
