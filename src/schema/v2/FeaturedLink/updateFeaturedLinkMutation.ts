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
  description?: string
  title?: string
  href?: string
  subtitle?: string
  sourceBucket?: string
  sourceKey?: string
}

interface GravityInput {
  description?: string
  title?: string
  href?: string
  subtitle?: string
  source_bucket?: string
  source_key?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateFeaturedLinkSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    featuredLink: {
      type: FeaturedLinkType,
      resolve: (featuredLink) => featuredLink,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateFeaturedLinkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateFeaturedLinkResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateFeaturedLinkMutation = mutationWithClientMutationId<
  Input & { id: string },
  any | null,
  ResolverContext
>({
  name: "UpdateFeaturedLinkMutation",
  description: "updates a featured link.",
  inputFields: {
    description: { type: GraphQLString },
    title: { type: GraphQLString },
    href: { type: GraphQLString },
    subtitle: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLString) },
    sourceBucket: { type: GraphQLString },
    sourceKey: { type: GraphQLString },
  },
  outputFields: {
    featuredLinkOrError: {
      type: ResponseOrErrorType,
      description: "On success: featured link updated.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateFeaturedLinkLoader }) => {
    if (!updateFeaturedLinkLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const { id, ...rest } = args

    const gravityArgs: GravityInput = {
      description: rest.description,
      title: rest.title,
      href: rest.href,
      subtitle: rest.subtitle,
      source_bucket: rest.sourceBucket,
      source_key: rest.sourceKey,
    }

    try {
      return await updateFeaturedLinkLoader(id, gravityArgs)
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
