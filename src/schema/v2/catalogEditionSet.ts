import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"
import { date } from "./fields/date"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "./fields/money"

export interface CatalogEditionSetGravityResponse {
  id: string
  edition_set_id: string
  price_minor: number | null
  availability: string | null
  created_at: string
  updated_at: string
}

export const CatalogEditionSetType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CatalogEditionSet",
  fields: {
    ...InternalIDFields,
    editionSetId: {
      type: GraphQLString,
      resolve: ({ edition_set_id }) => edition_set_id,
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
    availability: { type: GraphQLString },
    createdAt: date(),
    updatedAt: date(),
  },
})
