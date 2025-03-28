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
import { LocationType } from "../location"

interface Input {
  partnerID: string
  name?: string
  // position?: string
  // canContact?: boolean
  // email?: string
  // phone?: string
  // locationID?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerLocationSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    location: {
      type: LocationType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerLocationFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

// Check why this custom stuff is needed
const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerLocationOrError",
  types: [SuccessType, FailureType],
  resolveType: (value) => {
    if (value?._type === "GravityMutationError") {
      return "CreatePartnerLocationFailure"
    }
    return "CreatePartnerLocationSuccess"
  },
})

export const CreatePartnerLocationMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreatePartnerLocation",
  description: "Creates a new location for a partner",
  inputFields: {
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    name: {
      type: GraphQLString,
      description: "Location name",
    },
  },
  outputFields: {
    partnerLocationOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerID },
    { createPartnerLocationLoader }
  ) => {
    if (!createPartnerLocationLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await createPartnerLocationLoader(partnerID, {
        name: "Happy Gallery",
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
