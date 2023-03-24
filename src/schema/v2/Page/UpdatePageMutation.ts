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
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePageSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    page: {
      type: PageType,
      resolve: (page) => page,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePageFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePageResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdatePageMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "UpdatePageMutation",
  description: "Updates a page.",
  inputFields: {
    content: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    published: { type: new GraphQLNonNull(GraphQLBoolean) },
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    pageOrError: {
      type: ResponseOrErrorType,
      description: "On success: the page updated.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updatePageLoader }) => {
    if (!updatePageLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const { id, ...rest } = args

    try {
      return await updatePageLoader(id, rest)
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
