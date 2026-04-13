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

interface DistributePartnerListMutationInputProps {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DistributePartnerListSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: PartnerListType,
      resolve: (partnerList) => partnerList,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DistributePartnerListFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DistributePartnerListResponseOrError",
  types: [SuccessType, FailureType],
})

export const distributePartnerListMutation = mutationWithClientMutationId<
  DistributePartnerListMutationInputProps,
  any,
  ResolverContext
>({
  name: "DistributePartnerListMutation",
  description: "Distributes a partner list to Artsy, creating a draft show.",
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
        "On success: the distributed partner list. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { distributePartnerListLoader }) => {
    if (!distributePartnerListLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      return await distributePartnerListLoader(id)
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
