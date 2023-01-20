import { GraphQLString, GraphQLUnionType, GraphQLObjectType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { FeaturedLinkType } from "./featuredLink"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteFeaturedLinkSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    featuredLink: {
      type: FeaturedLinkType,
      resolve: (featuredLink) => featuredLink,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteFeaturedLinkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteFeaturedLinkResponseOrError",
  types: [SuccessType, FailureType],
})

export const DeleteFeaturedLinkMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "DeleteFeaturedLinkMutation",
  description: "deletes a featured link.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    featuredLinkOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteFeaturedLinkLoader }) => {
    if (!deleteFeaturedLinkLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await deleteFeaturedLinkLoader(id)
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
