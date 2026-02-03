import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ViewingRoomType } from "schema/v2/viewingRoom"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "PublishViewingRoomSuccess",
  isTypeOf: (data) => !data._type,
  fields: () => ({
    viewingRoom: {
      type: new GraphQLNonNull(ViewingRoomType),
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "PublishViewingRoomFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "PublishViewingRoomResponseOrError",
  types: [SuccessType, FailureType],
})

export const publishViewingRoomMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "PublishViewingRoom",
  inputFields: {
    viewingRoomID: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  outputFields: {
    viewingRoomOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the published viewing room. On error: the error that occurred.",
      resolve: (result) => result,
    },
    viewingRoom: {
      type: ViewingRoomType,
      deprecationReason:
        "Use viewingRoomOrError instead for proper error handling",
      resolve: (result) => {
        // Return the viewing room if successful, null if error
        return result._type === "GravityMutationError" ? null : result
      },
    },
  },
  mutateAndGetPayload: async (args, { updateViewingRoomLoader }) => {
    if (!updateViewingRoomLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await updateViewingRoomLoader(args.viewingRoomID, {
        published: true,
      })

      return response
    } catch (error) {
      const formatted = formatGravityError(error)
      if (formatted) {
        return { ...formatted, _type: "GravityMutationError" }
      }
      throw error
    }
  },
})
