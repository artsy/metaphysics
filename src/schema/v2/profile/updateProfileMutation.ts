import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import Profile, { ProfileType } from "../profile"
import { ResolverContext } from "types/graphql"

interface UpdateProfileMutationInputProps {
  id: string
  handle?: string | null
  bio?: string | null
  fullBio?: string | null
  website?: string | null
  location?: string | null
  isPrivate?: boolean | null
  menuColorClass?: string | null
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateProfileSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    profile: {
      type: ProfileType,
      resolve: (profile) => profile,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateProfileFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateProfileResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateProfileMutation = mutationWithClientMutationId<
  UpdateProfileMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdateProfileMutation",
  description: "Updates a profile.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the profile to update.",
    },
    handle: {
      type: GraphQLString,
      description: "Unique handle.",
    },
    bio: {
      type: GraphQLString,
      description: "Short bio (275 character max).",
    },
    fullBio: {
      type: GraphQLString,
      description: "Full bio (800 character max).",
    },
    website: {
      type: GraphQLString,
      description: "Website.",
    },
    location: {
      type: GraphQLString,
      description: "Location.",
    },
    isPrivate: {
      type: GraphQLBoolean,
      description: "Private profiles hide certain features for non admins.",
    },
    menuColorClass: {
      type: GraphQLString,
      description: "Menu color class.",
    },
  },
  outputFields: {
    profileOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated profile. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      id,
      handle,
      bio,
      fullBio,
      website,
      location,
      isPrivate,
      menuColorClass,
    },
    { updateProfileLoader }
  ) => {
    if (!updateProfileLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const profileData = {
        handle,
        bio,
        full_bio: fullBio,
        website,
        location,
        private: isPrivate,
        menu_color_class: menuColorClass,
      }

      const response = await updateProfileLoader(id, profileData)
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