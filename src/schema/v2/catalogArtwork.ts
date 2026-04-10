import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "./fields/money"
import { date } from "./fields/date"
import { CatalogArtworkDocumentType } from "./catalogArtworkDocument"

export const CatalogArtworkType = new GraphQLObjectType<any, ResolverContext>({
  name: "CatalogArtwork",
  fields: {
    ...InternalIDFields,
    artworkId: {
      type: GraphQLString,
      resolve: ({ artwork_id }) => artwork_id,
    },
    medium: {
      type: GraphQLString,
    },
    availability: { type: GraphQLString },
    priceCurrency: {
      type: GraphQLString,
      resolve: ({ price_currency }) => price_currency,
    },
    priceListed: {
      type: Money,
      resolve: (
        { price_minor: minor, price_currency: currencyCode },
        args,
        context,
        info
      ) => {
        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          args,
          context,
          info
        )
      },
    },
    privateNotes: {
      type: GraphQLString,
      resolve: ({ private_notes }) => private_notes,
    },
    documentsCount: {
      type: GraphQLInt,
      resolve: ({ documents_count }) => documents_count,
    },
    createdAt: date(),
    updatedAt: date(),
    documents: {
      type: new GraphQLList(CatalogArtworkDocumentType),
      description: "Documents attached to this catalog artwork.",
      resolve: async ({ id }, _args, { catalogArtworkDocumentsLoader }) => {
        if (!catalogArtworkDocumentsLoader) return null
        const { body } = await catalogArtworkDocumentsLoader({
          catalog_artwork_id: id,
        })
        return body
      },
    },
  },
})
