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
import { ArtworkType } from "schema/v2/artwork"
import { ArtworkVisibility } from "schema/v2/artwork/artworkVisibility"
import { ResolverContext } from "types/graphql"

interface createPartnerArtworkDuplicateMutationInputProps {
  partnerId: string
  artworkId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerArtworkDuplicateSuccess",
  isTypeOf: (data) => !!data._id,
  fields: () => ({
    artwork: {
      type: ArtworkType,
      resolve: (data) => data,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerArtworkDuplicateFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerArtworkDuplicateResponseOrError",
  types: [SuccessType, FailureType],
})

export const createPartnerArtworkDuplicateMutation = mutationWithClientMutationId<
  createPartnerArtworkDuplicateMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreatePartnerArtworkDuplicateMutation",
  description: "Creates a new artwork based off of an existing artwork",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner under which the artwork is created.",
    },
    originalId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the existing artwork that is to be duplicated.",
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Title of the newly duplicated artwork.",
    },
    visibilityLevel: {
      type: ArtworkVisibility,
      description: "The visibility level of the newly duplicated artwork.",
    },
  },
  outputFields: {
    artworkImportOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, originalId, title, visibilityLevel },
    { partnerArtworksDuplicateLoader }
  ) => {
    if (!partnerArtworksDuplicateLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      return await partnerArtworksDuplicateLoader(partnerId, {
        original_id: originalId,
        title,
        visibility_level: visibilityLevel,
      })
    } catch (error) {
      const formatted = formatGravityError(error)
      if (formatted) {
        return { ...formatted, _type: "GravityMutationError" }
      }
      throw error
    }
  },
})
