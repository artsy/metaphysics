import {
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

interface Input {
  instagramAccountId: string
  artworkId: string
  caption?: string
  collaborators?: string[]
}

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
  description: "Create and publish an Instagram post from an artwork",
  inputFields: {
    instagramAccountId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the Instagram account to post from",
    },
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork to post",
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
    { instagramAccountId, artworkId, caption, collaborators },
    { createInstagramPostLoader }
  ) => {
    if (!createInstagramPostLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await createInstagramPostLoader({
        instagram_account_id: instagramAccountId,
        artwork_id: artworkId,
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
