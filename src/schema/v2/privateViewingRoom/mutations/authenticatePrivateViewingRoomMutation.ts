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
import { PrivateViewingRoomContentsType } from "schema/v2/privateViewingRoom"

interface AuthenticatePrivateViewingRoomMutationInputProps {
  slug: string
  passcode: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "AuthenticatePrivateViewingRoomSuccess",
  isTypeOf: (data) => !data._type,
  fields: () => ({
    privateViewingRoom: {
      type: PrivateViewingRoomContentsType,
      resolve: (room) => room,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "AuthenticatePrivateViewingRoomFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "AuthenticatePrivateViewingRoomResponseOrError",
  types: [SuccessType, FailureType],
})

export const authenticatePrivateViewingRoomMutation = mutationWithClientMutationId<
  AuthenticatePrivateViewingRoomMutationInputProps,
  any,
  ResolverContext
>({
  name: "AuthenticatePrivateViewingRoomMutation",
  description:
    "Authenticates against a passcode-protected private viewing room, returning its contents on success.",
  inputFields: {
    slug: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug of the private viewing room.",
    },
    passcode: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The room's passcode.",
    },
  },
  outputFields: {
    privateViewingRoomOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the private viewing room's contents. On error: the error that occurred (e.g. an incorrect passcode).",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { slug, passcode },
    { authenticatePrivateViewingRoomLoader }
  ) => {
    try {
      return await authenticatePrivateViewingRoomLoader(slug, { passcode })
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
