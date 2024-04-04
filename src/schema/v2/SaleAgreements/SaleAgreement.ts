import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { markdown } from "schema/v2/fields/markdown"
import { connectionWithCursorInfo } from "../fields/pagination"
import { IDFields } from "../object_identification"
import { date } from "schema/v2/fields/date"
import { SaleType } from "schema/v2/sale"
import { SaleAgreementStatusEnum } from "schema/v2/SaleAgreements/SaleAgreementStatusEnum"

interface SaleAgreementGravityResponse {
  id: string
  content: string
  created_at: string
  displayStartAt: string
  displayEndAt: string
  published: boolean
  sale_id: string
  status: string
  updated_at: string
  user_id: string
}

export const SaleAgreementType = new GraphQLObjectType<
  SaleAgreementGravityResponse,
  ResolverContext
>({
  name: "SaleAgreement",
  fields: () => {
    return {
      ...IDFields,
      content: markdown((saleAgreement) => saleAgreement.content),
      createdAt: date(),
      displayStartAt: date(),
      displayEndAt: date(),
      published: {
        type: new GraphQLNonNull(GraphQLBoolean),
      },
      saleId: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ sale_id }) => {
          return sale_id
        },
      },
      sale: {
        type: SaleType,
      },
      status: { type: new GraphQLNonNull(SaleAgreementStatusEnum) },
      updatedAt: date(),
      userId: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ user_id }) => user_id,
      },
    }
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
