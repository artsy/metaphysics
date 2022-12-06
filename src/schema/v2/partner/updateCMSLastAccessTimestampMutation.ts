import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import Partner from "./partner"
import { ResolverContext } from "types/graphql"

interface UpdateCMSLastAccessTimestampMutationInputProps {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCMSLastAccessTimestampSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    partner: {
      type: Partner.type,
      resolve: (partner) => partner,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCMSLastAccessTimestampFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateCMSLastAccessTimestampResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateCMSLastAccessTimestampMutation = mutationWithClientMutationId<
  UpdateCMSLastAccessTimestampMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdateCMSLastAccessTimestampMutation",
  description: "Updates the flags on a partner.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the partner to update.",
    },
  },
  outputFields: {
    partnerOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated partner. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { updatePartnerFlagsLoader }) => {
    if (!updatePartnerFlagsLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const timestamp = new Date().toISOString()

      const response = await updatePartnerFlagsLoader(id, {
        key: "last_cms_access",
        value: timestamp,
      })

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
