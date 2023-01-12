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

export const CreateFeatureMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "CreateFeatureMutation",
  description: "Creates a feature.",
  inputFields: {
    description: { type: GraphQLString },
    layout: { type: FeatureLayoutsEnum },
    name: { type: new GraphQLNonNull(GraphQLString) },
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    callout: { type: GraphQLString },
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

    try {
      return await createFeatureLoader(args)
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
