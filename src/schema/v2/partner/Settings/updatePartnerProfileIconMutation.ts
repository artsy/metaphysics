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
import { ProfileType } from "schema/v2/profile"

interface UpdatePartnerProfileIconInputProps {
  profileId: string
  geminiToken?: string
  remoteImageUrl?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerProfileIconSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    profile: {
      type: ProfileType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerProfileIconFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerProfileIconOrError",
  types: [SuccessType, FailureType],
})

export const UpdatePartnerProfileIconMutation = mutationWithClientMutationId<
  UpdatePartnerProfileIconInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerProfileIcon",
  description: "Updates the image icon for a partner",
  inputFields: {
    profileId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner's profile",
    },
    geminiToken: {
      type: GraphQLString,
      description: "Gemini Token",
    },
    remoteImageUrl: {
      type: GraphQLString,
      description: "Profile icon image",
    },
  },
  outputFields: {
    profileOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { profileId, geminiToken, remoteImageUrl },
    { updatePartnerProfileIconLoader }
  ) => {
    if (!updatePartnerProfileIconLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await updatePartnerProfileIconLoader(profileId, {
        gemini_token: geminiToken,
        remove_image_url: remoteImageUrl,
      })

      console.log("response", response)
      return response
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
