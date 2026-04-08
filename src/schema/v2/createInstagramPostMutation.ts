import {
  GraphQLInputObjectType,
  GraphQLList,
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
import { InstagramPostType } from "./instagramPost"

interface SlideInput {
  artworkId: string
  imageUrl?: string
}

interface Input {
  instagramAccountId: string
  slides: SlideInput[]
  caption?: string
  collaborators?: string[]
}

const InstagramPostSlideInput = new GraphQLInputObjectType({
  name: "InstagramPostSlideInput",
  description:
    "A slide in an Instagram carousel post. The order of slides in the array determines their position in the carousel.",
  fields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork for this slide",
    },
    imageUrl: {
      type: GraphQLString,
      description:
        "Optional custom image URL to use instead of the artwork's default image",
    },
  },
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateInstagramPostSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    instagramPost: {
      type: InstagramPostType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateInstagramPostFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateInstagramPostResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "CreateInstagramPostFailure"
    }
    return "CreateInstagramPostSuccess"
  },
})

export const createInstagramPostMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreateInstagramPost",
  description:
    "Create and publish an Instagram post from one or more artworks or images.",
  inputFields: {
    instagramAccountId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the Instagram account to post from",
    },
    slides: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(InstagramPostSlideInput))
      ),
      description:
        "Slides for the Instagram post. Each slide references an artwork and optionally a custom image. The order determines the carousel position.",
    },
    caption: {
      type: GraphQLString,
      description: "Post caption (auto-generated from artwork data if omitted)",
    },
    collaborators: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "Up to 3 Instagram usernames to invite as collaborators",
    },
  },
  outputFields: {
    instagramPostOrError: {
      type: ResponseOrErrorType,
      description: "On success: the created Instagram post",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { instagramAccountId, slides, caption, collaborators },
    { createInstagramPostLoader }
  ) => {
    if (!createInstagramPostLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    if (slides.length === 0) {
      throw new Error("At least one slide must be provided")
    }

    try {
      return await createInstagramPostLoader({
        instagram_account_id: instagramAccountId,
        slides: slides.map((slide) => ({
          artwork_id: slide.artworkId,
          image_url: slide.imageUrl,
        })),
        caption,
        collaborators,
      })
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }
  },
})
