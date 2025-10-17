import {
  GraphQLString,
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { FeatureType } from "./FeatureType"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { FeatureLayoutsEnum } from "./FeatureLayoutsEnum"

interface GravityInput {
  description?: string
  name: string
  active: boolean
  callout?: string
  subheadline?: string
  layout?: string
  source_bucket?: string
  source_key?: string
  meta_title?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateFeatureSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    feature: {
      type: FeatureType,
      resolve: (feature) => feature,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateFeatureFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "createFeatureResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreateFeatureMutation = mutationWithClientMutationId({
  name: "CreateFeatureMutation",
  description: "Creates a feature.",
  inputFields: {
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    callout: { type: GraphQLString },
    description: { type: GraphQLString },
    layout: { type: FeatureLayoutsEnum },
    metaTitle: { type: GraphQLString },
    name: { type: new GraphQLNonNull(GraphQLString) },
    sourceBucket: { type: GraphQLString },
    sourceKey: { type: GraphQLString },
    subheadline: { type: GraphQLString },
  },
  outputFields: {
    featureOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createFeatureLoader }) => {
    if (!createFeatureLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const gravityArgs: GravityInput = {
      active: args.active,
      callout: args.callout,
      description: args.description,
      layout: args.layout,
      meta_title: args.metaTitle,
      name: args.name,
      source_bucket: args.sourceBucket,
      source_key: args.sourceKey,
      subheadline: args.subheadline,
    }

    try {
      return await createFeatureLoader(gravityArgs)
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
