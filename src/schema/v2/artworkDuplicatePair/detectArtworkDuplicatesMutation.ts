import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

const DetectArtworkDuplicatesSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "DetectArtworkDuplicatesSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    status: {
      type: GraphQLString,
      resolve: ({ status }) => status,
    },
    partnerId: {
      type: GraphQLString,
      resolve: ({ partner_id }) => partner_id,
    },
    detectionVersion: {
      type: GraphQLString,
      resolve: ({ detection_version }) => detection_version,
    },
  }),
})

const DetectArtworkDuplicatesFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "DetectArtworkDuplicatesFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const DetectArtworkDuplicatesResponseOrErrorType = new GraphQLUnionType({
  name: "DetectArtworkDuplicatesResponseOrError",
  types: [
    DetectArtworkDuplicatesSuccessType,
    DetectArtworkDuplicatesFailureType,
  ],
})

export const detectArtworkDuplicatesMutation = mutationWithClientMutationId({
  name: "DetectArtworkDuplicatesMutation",
  description: "Trigger duplicate detection for a partner's artworks",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner",
    },
    detectionVersion: {
      type: GraphQLString,
      description: "Optional detection version to use",
    },
  },
  outputFields: {
    detectArtworkDuplicatesResponseOrError: {
      type: DetectArtworkDuplicatesResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, detectionVersion },
    { detectArtworkDuplicatesLoader }
  ) => {
    if (!detectArtworkDuplicatesLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityArgs: Record<string, any> = {
        partner_id: partnerId,
      }

      if (detectionVersion) {
        gravityArgs.detection_version = detectionVersion
      }

      const result = await detectArtworkDuplicatesLoader(gravityArgs)
      return result
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error instanceof Error ? error : new Error(String(error))
      }
    }
  },
})
