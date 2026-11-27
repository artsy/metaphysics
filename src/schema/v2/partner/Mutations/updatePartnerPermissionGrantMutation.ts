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
import { PartnerPermissionGrantType } from "../partnerPermissionGrant"

interface Input {
  grantID: string
  presetKey?: string
  permissions?: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerPermissionGrantSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    partnerPermissionGrant: {
      type: PartnerPermissionGrantType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerPermissionGrantFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerPermissionGrantResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError"
      ? "UpdatePartnerPermissionGrantFailure"
      : "UpdatePartnerPermissionGrantSuccess",
})

export const updatePartnerPermissionGrantMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "UpdatePartnerPermissionGrant",
  description: "Change what a user can do for a partner in ArtOS.",
  inputFields: {
    grantID: { type: new GraphQLNonNull(GraphQLString) },
    presetKey: {
      type: GraphQLString,
      description: "Preset to grant, such as viewer, editor or owner.",
    },
    permissions: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "Permission keys to grant instead of a preset.",
    },
  },
  outputFields: {
    partnerPermissionGrantOrError: {
      type: ResponseOrErrorType,
      description: "On success: the updated grant",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    input,
    { updatePartnerPermissionGrantLoader }
  ) => {
    if (!updatePartnerPermissionGrantLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await updatePartnerPermissionGrantLoader(input.grantID, {
        preset_key: input.presetKey,
        permissions: input.permissions,
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
