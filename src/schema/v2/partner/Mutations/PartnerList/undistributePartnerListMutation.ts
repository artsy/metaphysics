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

interface UndistributePartnerListMutationInputProps {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UndistributePartnerListSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: PartnerListType,
      resolve: (partnerList) => partnerList,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UndistributePartnerListFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UndistributePartnerListResponseOrError",
  types: [SuccessType, FailureType],
})

export const undistributePartnerListMutation = mutationWithClientMutationId<
  UndistributePartnerListMutationInputProps,
  any,
  ResolverContext
>({
  name: "UndistributePartnerListMutation",
  description:
    "Returns a distributed partner list to private, deleting its Artsy show. Artworks stay in inventory.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner list.",
    },
  },
  outputFields: {
    partnerListOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the un-distributed partner list. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { undistributePartnerListLoader }) => {
    if (!undistributePartnerListLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      return await undistributePartnerListLoader(id)
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
