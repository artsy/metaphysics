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
import { PartnerListType, PartnerListTypeEnum } from "schema/v2/partnerList"

interface CreatePartnerListMutationInputProps {
  partnerID: string
  name: string
  listType?: string
  startAt?: string
  endAt?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerListSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: PartnerListType,
      resolve: (partnerList) => partnerList,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerListFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerListResponseOrError",
  types: [SuccessType, FailureType],
})

export const createPartnerListMutation = mutationWithClientMutationId<
  CreatePartnerListMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreatePartnerListMutation",
  description: "Creates a new partner list.",
  inputFields: {
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The name of the list.",
    },
    listType: {
      type: PartnerListTypeEnum,
      description: "The type of list (show, fair, or other).",
    },
    startAt: {
      type: GraphQLString,
      description: "Start date for the list.",
    },
    endAt: {
      type: GraphQLString,
      description: "End date for the list.",
    },
  },
  outputFields: {
    partnerListOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the created partner list. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerID, name, listType, startAt, endAt },
    { createPartnerListLoader }
  ) => {
    if (!createPartnerListLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const gravityArgs: Record<string, unknown> = {
      partner_id: partnerID,
      name,
    }

    if (listType !== undefined) gravityArgs.list_type = listType
    if (startAt !== undefined) gravityArgs.start_at = startAt
    if (endAt !== undefined) gravityArgs.end_at = endAt

    try {
      return await createPartnerListLoader(gravityArgs)
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
