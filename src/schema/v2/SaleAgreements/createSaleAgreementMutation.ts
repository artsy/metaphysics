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
import { SaleAgreementType } from "./saleAgreement"

interface Input {
  body: string
  published: boolean
  saleId: string
  status: "active" | "inactive" | "archived"
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
    body: { type: new GraphQLNonNull(GraphQLString) },
    published: { type: new GraphQLNonNull(GraphQLBoolean) },
    saleId: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(GraphQLString) },
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

    const { body, published, saleId, status } = args

    try {
      return await createSaleAgreementLoader({
        body,
        published,
        sale_id: saleId,
        status,
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
