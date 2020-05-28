import { GraphQLObjectType, GraphQLString, GraphQLUnionType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"

const SendConfirmationEmailMutationSuccess = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "SendConfirmationEmailMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    confirmationSentAt: {
      type: GraphQLString,
      resolve: ({ confirmation_sent_at }) => confirmation_sent_at,
    },
    unconfirmedEmail: {
      type: GraphQLString,
      resolve: ({ unconfirmed_email }) => unconfirmed_email,
    },
  }),
})

const SendConfirmationEmailMutationFailure = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "SendConfirmationEmailMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const sendConfirmationEmailMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "SendConfirmationEmailMutation",
  description: "Send a confirmation email",
  inputFields: {}, // TODO: Is this the right way to say "This mutation does not take any arguments"?
  outputFields: {
    confirmationOrError: {
      type: new GraphQLUnionType({
        name: "SendConfirmationEmailMutationType",
        types: [
          SendConfirmationEmailMutationSuccess,
          SendConfirmationEmailMutationFailure,
        ],
      }),
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: (_, { sendConfirmationEmailLoader }) => {
    if (!sendConfirmationEmailLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return sendConfirmationEmailLoader()
      .then((result) => result)
      .catch((error) => {
        const formattedErr = formatGravityError(error)
        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw new Error(error)
        }
      })
  },
})
