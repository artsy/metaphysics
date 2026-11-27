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
  partnerID: string
  userID: string
  presetKey?: string
  permissions?: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerPermissionGrantSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    partnerPermissionGrant: {
      type: PartnerPermissionGrantType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerPermissionGrantFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerPermissionGrantResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError"
      ? "CreatePartnerPermissionGrantFailure"
      : "CreatePartnerPermissionGrantSuccess",
})

export const createPartnerPermissionGrantMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreatePartnerPermissionGrant",
  description:
    "Give a user access to a partner in ArtOS, with a preset or a list of permissions.",
  inputFields: {
    partnerID: { type: new GraphQLNonNull(GraphQLString) },
    userID: { type: new GraphQLNonNull(GraphQLString) },
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
      description: "On success: the new grant",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    input,
    { createPartnerPermissionGrantLoader }
  ) => {
    if (!createPartnerPermissionGrantLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await createPartnerPermissionGrantLoader({
        partner_id: input.partnerID,
        user_id: input.userID,
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
