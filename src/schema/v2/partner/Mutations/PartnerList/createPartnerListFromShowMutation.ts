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
import { PartnerListType } from "schema/v2/partnerList"
import { ShowType } from "schema/v2/show"

interface CreatePartnerListFromShowMutationInputProps {
  partnerID: string
  showID: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerListFromShowSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: new GraphQLNonNull(PartnerListType),
      resolve: (partnerList) => partnerList,
    },
    show: {
      type: ShowType,
      description:
        "The source show, so clients can refresh fields like `partnerList`.",
      resolve: (
        { partner_id, partner_show_id },
        _args,
        { partnerShowLoader }
      ) => partnerShowLoader({ partner_id, show_id: partner_show_id }),
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerListFromShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerListFromShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const createPartnerListFromShowMutation = mutationWithClientMutationId<
  CreatePartnerListFromShowMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreatePartnerListFromShowMutation",
  description:
    "Creates a partner list from an existing show (adds the show to inventory).",
  inputFields: {
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
    showID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the show to create the list from.",
    },
  },
  outputFields: {
    partnerListOrError: {
      type: new GraphQLNonNull(ResponseOrErrorType),
      description:
        "On success: the created partner list. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerID, showID },
    { createPartnerListFromShowLoader }
  ) => {
    if (!createPartnerListFromShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      return await createPartnerListFromShowLoader({
        partner_id: partnerID,
        partner_show_id: showID,
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
