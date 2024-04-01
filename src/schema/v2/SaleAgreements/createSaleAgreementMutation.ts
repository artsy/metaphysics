import {
  GraphQLString,
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { SaleAgreementType } from "./SaleAgreement"
import { SaleAgreementStatusEnum } from "./SaleAgreementStatusEnum"

interface Input {
  content: string
  displayStartAt: string
  displayEndAt: string
  published: boolean
  saleId: string
  status: "past" | "current" | "archived"
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateSaleAgreementSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    saleAgreement: {
      type: SaleAgreementType,
      resolve: (saleAgreement) => saleAgreement,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateSaleAgreementFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateSaleAgreementResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreateSaleAgreementMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "CreateSaleAgreementMutation",
  description: "Creates a static Markdown-backed sale agreement.",
  inputFields: {
    content: { type: new GraphQLNonNull(GraphQLString) },
    displayStartAt: { type: GraphQLString },
    displayEndAt: { type: GraphQLString },
    published: { type: new GraphQLNonNull(GraphQLBoolean) },
    saleId: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(SaleAgreementStatusEnum) },
  },
  outputFields: {
    saleAgreementOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createSaleAgreementLoader }) => {
    if (!createSaleAgreementLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const {
      content,
      displayEndAt,
      displayStartAt,
      published,
      saleId,
      status,
    } = args

    try {
      const result = await createSaleAgreementLoader({
        content,
        display_end_at: displayEndAt,
        display_start_at: displayStartAt,
        published,
        sale_id: saleId,
        status,
      })
      return result
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
