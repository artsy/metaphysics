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
import { LocationType } from "schema/v2/location"
import { ResolverContext } from "types/graphql"

interface DeletePartnerLocationInputProps {
  LocationId: string
  partnerId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerLocationSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    location: {
      type: LocationType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerLocationFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeletePartnerLocationOrError",
  types: [SuccessType, FailureType],
})

export const DeletePartnerLocationMutation = mutationWithClientMutationId<
  DeletePartnerLocationInputProps,
  any,
  ResolverContext
>({
  name: "DeletePartnerLocationMutation",
  description: "Deletes a location for a partner",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    locationId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the Location to delete",
    },
  },
  outputFields: {
    partnerLocationOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, LocationId },
    { deletePartnerLocationLoader }
  ) => {
    if (!deletePartnerLocationLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await deletePartnerLocationLoader({
        partnerId,
        LocationId,
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
