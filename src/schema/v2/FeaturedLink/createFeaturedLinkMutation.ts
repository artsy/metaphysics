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
  description: string
  title: string
  href: string
  subtitle?: string
  sourceBucket?: string
  sourceKey?: string
}

interface GravityInput {
  description: string
  title: string
  href: string
  subtitle?: string
  source_bucket?: string
  source_key?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateFeaturedLinkSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    featuredLink: {
      type: FeaturedLinkType,
      resolve: (featuredLink) => featuredLink,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateFeaturedLinkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateFeaturedLinkResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreateFeaturedLinkMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "CreateFeaturedLinkMutation",
  description: "Creates a featured link.",
  inputFields: {
    description: { type: GraphQLString },
    title: { type: new GraphQLNonNull(GraphQLString) },
    href: { type: new GraphQLNonNull(GraphQLString) },
    subtitle: { type: GraphQLString },
    sourceBucket: { type: GraphQLString },
    sourceKey: { type: GraphQLString },
  },
  outputFields: {
    featuredLinkOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createFeaturedLinkLoader }) => {
    if (!createFeaturedLinkLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const gravityArgs: GravityInput = {
      description: args.description,
      title: args.title,
      href: args.href,
      subtitle: args.subtitle,
      source_bucket: args.sourceBucket,
      source_key: args.sourceKey,
    }

    try {
      return await createFeaturedLinkLoader(gravityArgs)
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
