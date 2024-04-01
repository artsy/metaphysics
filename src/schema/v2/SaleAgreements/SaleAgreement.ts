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
import { SaleAgreementStatusEnum } from "./SaleAgreementStatusEnum"

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
  updated_by: string
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
        type: GraphQLString,
        resolve: (res) => {
          return res.sale_id
        },
      },
      sale: {
        type: SaleType,
      },
      status: { type: new GraphQLNonNull(SaleAgreementStatusEnum) },
      updatedAt: date(),
      updatedBy: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ updated_by }) => updated_by,
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
