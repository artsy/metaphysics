import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { CRMContactLocationType } from "./crmContactLocation"
import {
  NOT_SIGNED_IN,
  responseOrErrorType,
  withGravityMutationError,
} from "./mutationHelpers"

const countryCodeField = {
  type: GraphQLString,
  description: "ISO 3166-1 alpha-2 country code",
}

const cityNameField = {
  type: GraphQLString,
  description: "Leave blank for a country-level location",
}

const CreateResponseOrErrorType = responseOrErrorType({
  name: "CreateCRMContactLocation",
  payloadField: "crmContactLocation",
  payloadType: CRMContactLocationType,
})

export const createCRMContactLocationMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateCRMContactLocation",
  description: "Add a location to a CRM contact",
  inputFields: {
    crmContactID: { type: new GraphQLNonNull(GraphQLString) },
    countryCode: {
      ...countryCodeField,
      type: new GraphQLNonNull(GraphQLString),
    },
    cityName: cityNameField,
    isPrimary: {
      type: GraphQLBoolean,
      description:
        "The first location is always primary. Later, true demotes the previous primary.",
    },
  },
  outputFields: {
    crmContactLocationOrError: {
      type: CreateResponseOrErrorType,
      description: "On success: the created location",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { crmContactID, countryCode, cityName, isPrimary },
    { createCrmContactLocationLoader }
  ) => {
    if (!createCrmContactLocationLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      createCrmContactLocationLoader({
        crm_contact_id: crmContactID,
        country_code: countryCode,
        city_name: cityName,
        is_primary: isPrimary,
      })
    )
  },
})

const UpdateResponseOrErrorType = responseOrErrorType({
  name: "UpdateCRMContactLocation",
  payloadField: "crmContactLocation",
  payloadType: CRMContactLocationType,
})

export const updateCRMContactLocationMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateCRMContactLocation",
  description:
    "Change a location. The primary can't be unset: make another location primary instead.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the location",
    },
    countryCode: countryCodeField,
    cityName: cityNameField,
    isPrimary: {
      type: GraphQLBoolean,
      description: "true demotes the previous primary",
    },
  },
  outputFields: {
    crmContactLocationOrError: {
      type: UpdateResponseOrErrorType,
      description: "On success: the updated location",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, countryCode, cityName, isPrimary },
    { updateCrmContactLocationLoader }
  ) => {
    if (!updateCrmContactLocationLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      updateCrmContactLocationLoader(id, {
        country_code: countryCode,
        city_name: cityName,
        is_primary: isPrimary,
      })
    )
  },
})

const DeleteResponseOrErrorType = responseOrErrorType({
  name: "DeleteCRMContactLocation",
  payloadField: "crmContactLocation",
  payloadType: CRMContactLocationType,
})

export const deleteCRMContactLocationMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteCRMContactLocation",
  description:
    "Remove a location. If it was the primary, the contact's oldest remaining location becomes primary.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the location",
    },
  },
  outputFields: {
    crmContactLocationOrError: {
      type: DeleteResponseOrErrorType,
      description: "On success: the removed location",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteCrmContactLocationLoader }) => {
    if (!deleteCrmContactLocationLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() => deleteCrmContactLocationLoader(id))
  },
})
