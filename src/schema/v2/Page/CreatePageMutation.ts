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
import { PageType } from "./Page"

interface Input {
  published: boolean
  name: string
  content: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePageSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    page: {
      type: PageType,
      resolve: (page) => page,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePageFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePageResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreatePageMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "CreatePageMutation",
  description: "Creates a static Markdown-backed page.",
  inputFields: {
    content: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    published: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
  outputFields: {
    pageOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createPageLoader }) => {
    if (!createPageLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await createPageLoader(args)
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
