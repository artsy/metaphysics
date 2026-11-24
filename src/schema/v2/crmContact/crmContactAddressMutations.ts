import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  CRMContactAddressType,
  CRMContactAddressTypeEnum,
} from "./crmContactAddress"
import {
  NOT_SIGNED_IN,
  responseOrErrorType,
  withGravityMutationError,
} from "./mutationHelpers"

const addressLine2Field = {
  type: GraphQLString,
  description: "Leave blank to clear",
}
const regionField = {
  type: GraphQLString,
  description: "State or region. Leave blank to clear",
}
const countryField = {
  type: GraphQLString,
  description: "ISO 3166-1 alpha-2 country code",
}

const SaveResponseOrErrorType = responseOrErrorType({
  name: "SaveCRMContactAddress",
  payloadField: "crmContactAddress",
  payloadType: CRMContactAddressType,
})

export const saveCRMContactAddressMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "SaveCRMContactAddress",
  description:
    "Save a CRM contact's address of the given type. Replaces the existing address of that type, if any.",
  inputFields: {
    crmContactID: { type: new GraphQLNonNull(GraphQLString) },
    addressType: { type: new GraphQLNonNull(CRMContactAddressTypeEnum) },
    addressLine1: { type: new GraphQLNonNull(GraphQLString) },
    addressLine2: addressLine2Field,
    city: { type: new GraphQLNonNull(GraphQLString) },
    region: regionField,
    postalCode: { type: new GraphQLNonNull(GraphQLString) },
    country: { ...countryField, type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    crmContactAddressOrError: {
      type: SaveResponseOrErrorType,
      description: "On success: the saved address",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      crmContactID,
      addressType,
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      country,
    },
    { saveCrmContactAddressLoader }
  ) => {
    if (!saveCrmContactAddressLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      saveCrmContactAddressLoader({
        crm_contact_id: crmContactID,
        address_type: addressType,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city,
        region,
        postal_code: postalCode,
        country,
      })
    )
  },
})

const UpdateResponseOrErrorType = responseOrErrorType({
  name: "UpdateCRMContactAddress",
  payloadField: "crmContactAddress",
  payloadType: CRMContactAddressType,
})

export const updateCRMContactAddressMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateCRMContactAddress",
  description: "Change an address. Its type cannot change.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the address",
    },
    addressLine1: { type: GraphQLString },
    addressLine2: addressLine2Field,
    city: { type: GraphQLString },
    region: regionField,
    postalCode: { type: GraphQLString },
    country: countryField,
  },
  outputFields: {
    crmContactAddressOrError: {
      type: UpdateResponseOrErrorType,
      description: "On success: the updated address",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, addressLine1, addressLine2, city, region, postalCode, country },
    { updateCrmContactAddressLoader }
  ) => {
    if (!updateCrmContactAddressLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      updateCrmContactAddressLoader(id, {
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city,
        region,
        postal_code: postalCode,
        country,
      })
    )
  },
})

const DeleteResponseOrErrorType = responseOrErrorType({
  name: "DeleteCRMContactAddress",
  payloadField: "crmContactAddress",
  payloadType: CRMContactAddressType,
})

export const deleteCRMContactAddressMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteCRMContactAddress",
  description: "Remove an address from a CRM contact",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the address",
    },
  },
  outputFields: {
    crmContactAddressOrError: {
      type: DeleteResponseOrErrorType,
      description: "On success: the removed address",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteCrmContactAddressLoader }) => {
    if (!deleteCrmContactAddressLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() => deleteCrmContactAddressLoader(id))
  },
})
