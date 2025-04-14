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
import GraphQLJSON from "graphql-type-json"

interface UpdatePartnerFlagsMutationInputProps {
  id: string
  flags: Record<string, string>
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerFlagsSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    partner: {
      type: Partner.type,
      resolve: (partner) => partner,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerFlagsFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerFlagsResponseOrError",
  types: [SuccessType, FailureType],
})

export const updatePartnerFlagsMutation = mutationWithClientMutationId<
  UpdatePartnerFlagsMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerFlagsMutation",
  description: "Updates multiple flags on a partner simultaneously.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the partner to update.",
    },
    flags: {
      type: new GraphQLNonNull(GraphQLJSON),
      description: "An object containing flag keys and values to update. If a value is empty, the flag will be unset.",
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
  mutateAndGetPayload: async ({ id, flags }, { updatePartnerFlagsLoader }) => {
    if (!updatePartnerFlagsLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await updatePartnerFlagsLoader(id, { flags })
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