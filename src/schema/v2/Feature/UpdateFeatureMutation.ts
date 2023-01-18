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
  description: string
  name: string
  active: boolean
  callout: string
  subheadline: string
  layout: string
  id: string
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
    name: { type: new GraphQLNonNull(GraphQLString) },
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    callout: { type: GraphQLString },
    subheadline: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    featureOrError: {
      type: ResponseOrErrorType,
      description: "On success: the ordered set updated.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateFeatureLoader }) => {
    if (!updateFeatureLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const { id, ...rest } = args

    try {
      return await updateFeatureLoader(id, rest)
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
