import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { markdown } from "../fields/markdown"
import { connectionWithCursorInfo } from "../fields/pagination"
import { IDFields } from "../object_identification"
import { date } from "../fields/date"
import { SaleType } from "../sale"

interface SaleAgreementGravityResponse {
  id: string
  body: string
  created_at: string
  published: boolean
  sale_id: string
  status: string
  updated_at: string
  updated_by: string
}

export const SaleAgreementType = new GraphQLObjectType<
  SaleAgreementGravityResponse,
  ResolverContext
>({
  name: "SaleAgreement",
  fields: {
    ...IDFields,
    body: markdown(),
    createdAt: date(),
    published: { type: GraphQLBoolean },
    saleId: {
      type: GraphQLString,
      resolve: ({ sale_id }) => sale_id,
    },
    sale: {
      type: SaleType,
      resolve: ({ sale_id }, _options, { saleLoader }) => {
        if (!sale_id) return null
        return saleLoader(sale_id)
      },
    },
    status: { type: GraphQLString },
    updatedAt: date(),
    updatedBy: { type: GraphQLString, resolve: ({ updated_by }) => updated_by },
  },
})

export const SaleAgreement: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  type: new GraphQLNonNull(SaleAgreementType),
  resolve: (_source, { id }, { saleAgreementLoader }) => {
    return saleAgreementLoader(id)
  },
}

export const saleAgreementConnectionType = connectionWithCursorInfo({
  nodeType: SaleAgreementType,
}).connectionType
