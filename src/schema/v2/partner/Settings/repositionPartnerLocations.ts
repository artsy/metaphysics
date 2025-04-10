import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { PartnerType } from "../partner"

interface RepositionPartnerLocationsProps {
  partnerId: string
  locationIds: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionPartnerLocationsSuccess",
  isTypeOf: (data) => !!data._id,
  fields: () => ({
    partner: {
      type: PartnerType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionPartnerLocationsFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RepositionPartnerLocationsSuccessOrError",
  types: [SuccessType, FailureType],
})

export const repositionPartnerLocationsMutation = mutationWithClientMutationId<
  RepositionPartnerLocationsProps,
  any,
  ResolverContext
>({
  name: "RepositionPartnerLocationsMutation",
  description:
    "Reposition partners locations in various CMS surfaces, settings, Artwork Form, etc.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID partner.",
    },
    locationIds: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description:
        "An ordered array of location IDs representing the new display order.",
    },
  },
  outputFields: {
    partnerOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, locationIds },
    { repositionPartnerLocationsLoader }
  ) => {
    if (!repositionPartnerLocationsLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await repositionPartnerLocationsLoader(partnerId, {
        location_ids: locationIds,
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
