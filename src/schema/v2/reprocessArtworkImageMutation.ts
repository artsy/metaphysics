import {
  GraphQLBoolean,
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

const ReprocessArtworkImageSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ReprocessArtworkImageSuccess",
  isTypeOf: (data) => data.success === true,
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: () => true,
    },
  }),
})

const ReprocessArtworkImageFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ReprocessArtworkImageFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ReprocessArtworkImageMutationType = new GraphQLUnionType({
  name: "ReprocessArtworkImageMutationType",
  types: [ReprocessArtworkImageSuccessType, ReprocessArtworkImageFailureType],
})

interface ReprocessArtworkImageMutationInput {
  artworkID: string
  imageID: string
}

export const ReprocessArtworkImageMutation = mutationWithClientMutationId<
  ReprocessArtworkImageMutationInput,
  any,
  ResolverContext
>({
  name: "ReprocessArtworkImage",
  description:
    "Requests Gravity to reprocess the original asset for an artwork image.",
  inputFields: {
    artworkID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    imageID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    artworkOrError: {
      type: ReprocessArtworkImageMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkID, imageID },
    { updateArtworkImageLoader }
  ) => {
    if (!updateArtworkImageLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      await updateArtworkImageLoader(
        { artworkID, imageID },
        { reprocess_original: true }
      )

      return { success: true }
    } catch (error) {
      console.error(error)
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error as any)
      }
    }
  },
})
