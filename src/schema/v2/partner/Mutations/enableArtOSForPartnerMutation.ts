import {
  GraphQLInt,
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

interface Input {
  partnerID: string
}

const EnablementType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtOSPartnerEnablement",
  fields: () => ({
    createdGrantsCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ created_grant_ids }) => created_grant_ids.length,
    },
    skippedUsersCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ skipped_user_ids }) => skipped_user_ids.length,
    },
  }),
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "EnableArtOSForPartnerSuccess",
  isTypeOf: (data) => Array.isArray(data.created_grant_ids),
  fields: () => ({
    enablement: {
      type: EnablementType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "EnableArtOSForPartnerFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "EnableArtOSForPartnerResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError"
      ? "EnableArtOSForPartnerFailure"
      : "EnableArtOSForPartnerSuccess",
})

export const enableArtOSForPartnerMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "EnableArtOSForPartner",
  description:
    "Give every user with CMS access to a partner the editor preset in ArtOS. Requires the artos_support role.",
  inputFields: {
    partnerID: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    enablementOrError: {
      type: ResponseOrErrorType,
      description: "On success: how many grants were created and users skipped",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (input, { enableArtOSForPartnerLoader }) => {
    if (!enableArtOSForPartnerLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await enableArtOSForPartnerLoader({ partner_id: input.partnerID })
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
