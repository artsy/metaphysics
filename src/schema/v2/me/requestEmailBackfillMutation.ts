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
import { EmailBackfillRunType } from "./emailBackfillRun"

interface Input {
  id: string
  backfillSince: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RequestEmailBackfillSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    emailBackfillRun: {
      type: EmailBackfillRunType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RequestEmailBackfillFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RequestEmailBackfillResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "RequestEmailBackfillFailure"
    }
    return "RequestEmailBackfillSuccess"
  },
})

export const requestEmailBackfillMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "RequestEmailBackfill",
  description:
    "Queue a backfill of an email account’s mail from a date up to now. Returns the run, which can be polled with `emailBackfillRun`.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the email account",
    },
    backfillSince: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "ISO 8601 time to import mail from. Must be in the past and after April 2004.",
    },
  },
  outputFields: {
    emailBackfillRunOrError: {
      type: ResponseOrErrorType,
      description: "On success: the queued backfill run",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, backfillSince },
    { requestEmailBackfillLoader }
  ) => {
    if (!requestEmailBackfillLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await requestEmailBackfillLoader(id, {
        backfill_since: backfillSince,
      })
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
