import {
  GraphQLString,
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLNonNull,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { SaleAgreementType } from "./SaleAgreement"
import { SaleAgreementStatusEnum } from "./SaleAgreementStatusEnum"

interface Input {
  id: string
  content: string
  displayStartAt: string
  displayEndAt: string
  published: boolean
  saleId: string
  status: "past" | "current" | "archived"
}
const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateSaleAgreementSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    saleAgreement: {
      type: SaleAgreementType,
      resolve: (saleAgreement) => saleAgreement,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateSaleAgreementFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateSaleAgreementResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateSaleAgreementMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "UpdateSaleAgreementMutation",
  description: "Updates a saleAgreement.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: GraphQLString },
    displayStartAt: { type: GraphQLString },
    displayEndAt: { type: GraphQLString },
    published: { type: GraphQLBoolean },
    status: { type: SaleAgreementStatusEnum },
    saleId: { type: GraphQLString },
  },
  outputFields: {
    saleAgreementOrError: {
      type: ResponseOrErrorType,
      description: "On success: the saleAgreement updated.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateSaleAgreementLoader }) => {
    if (!updateSaleAgreementLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const { id, displayStartAt, displayEndAt, saleId, ...rest } = args

    try {
      return await updateSaleAgreementLoader(id, {
        ...rest,
        display_start_at: displayStartAt,
        display_end_at: displayEndAt,
        sale_id: saleId,
      })
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
