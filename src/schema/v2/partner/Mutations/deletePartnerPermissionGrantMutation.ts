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
import { PartnerPermissionGrantType } from "../partnerPermissionGrant"

interface Input {
  grantID: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerPermissionGrantSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    partnerPermissionGrant: {
      type: PartnerPermissionGrantType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerPermissionGrantFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeletePartnerPermissionGrantResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError"
      ? "DeletePartnerPermissionGrantFailure"
      : "DeletePartnerPermissionGrantSuccess",
})

export const deletePartnerPermissionGrantMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "DeletePartnerPermissionGrant",
  description: "Remove a user's ArtOS access to a partner.",
  inputFields: {
    grantID: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    partnerPermissionGrantOrError: {
      type: ResponseOrErrorType,
      description: "On success: the removed grant",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    input,
    { deletePartnerPermissionGrantLoader }
  ) => {
    if (!deletePartnerPermissionGrantLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await deletePartnerPermissionGrantLoader(input.grantID)
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
