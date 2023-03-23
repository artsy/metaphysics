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
  description?: string
  name?: string
  active?: boolean
  callout?: string
  subheadline?: string
  layout?: string
  id: string
  sourceBucket?: string
  sourceKey?: string
}

interface GravityInput {
  description?: string
  name?: string
  active?: boolean
  callout?: string
  subheadline?: string
  layout?: string
  source_bucket?: string
  source_key?: string
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
    description: { type: GraphQLString },
    layout: { type: FeatureLayoutsEnum },
    name: { type: GraphQLString },
    active: { type: GraphQLBoolean },
    callout: { type: GraphQLString },
    subheadline: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLString) },
    sourceBucket: { type: GraphQLString },
    sourceKey: { type: GraphQLString },
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

    const { id, description, name, active, callout, subheadline, layout } = args

    const gravityArgs: GravityInput = {
      description,
      name,
      active,
      callout,
      subheadline,
      layout,
      source_bucket: args.sourceBucket,
      source_key: args.sourceKey,
    }

    try {
      return await updateFeatureLoader(id, gravityArgs)
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
