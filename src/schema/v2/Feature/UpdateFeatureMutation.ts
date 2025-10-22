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

interface Input {
  active?: boolean
  callout?: string
  description?: string
  id: string
  layout?: string
  metaTitle?: string
  name?: string
  sourceBucket?: string
  sourceKey?: string
  subheadline?: string
  videoURL?: string
}

interface GravityInput {
  active?: boolean
  callout?: string
  description?: string
  layout?: string
  meta_title?: string
  name?: string
  source_bucket?: string
  source_key?: string
  subheadline?: string
  video_url?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateFeatureSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    feature: {
      type: FeatureType,
      resolve: (feature) => feature,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateFeatureFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateFeatureResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateFeatureMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "UpdateFeatureMutation",
  description: "updates a feature.",
  inputFields: {
    active: { type: GraphQLBoolean },
    callout: { type: GraphQLString },
    description: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLString) },
    layout: { type: FeatureLayoutsEnum },
    metaTitle: { type: GraphQLString },
    name: { type: GraphQLString },
    sourceBucket: { type: GraphQLString },
    sourceKey: { type: GraphQLString },
    subheadline: { type: GraphQLString },
    videoURL: { type: GraphQLString },
  },
  outputFields: {
    featureOrError: {
      type: ResponseOrErrorType,
      description: "On success: the feature updated.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateFeatureLoader }) => {
    if (!updateFeatureLoader) {
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
      video_url: args.videoURL,
    }

    try {
      return await updateFeatureLoader(args.id, gravityArgs)
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
