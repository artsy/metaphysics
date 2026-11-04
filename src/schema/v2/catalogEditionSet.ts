import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"
import { date } from "./fields/date"
import { moneyFieldFromMinor } from "./fields/money"

export interface CatalogEditionSetGravityResponse {
  id: string
  edition_set_id: string
  price_minor: number | null
  price_currency: string | null
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
    priceCurrency: {
      type: GraphQLString,
      resolve: ({ price_currency }) => price_currency,
    },
    priceListed: moneyFieldFromMinor<CatalogEditionSetGravityResponse>(
      "price_minor"
    ),
    availability: { type: GraphQLString },
    createdAt: date(),
    updatedAt: date(),
  },
})
