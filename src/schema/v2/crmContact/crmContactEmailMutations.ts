import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { CRMContactEmailType } from "./crmContactEmail"
import {
  NOT_SIGNED_IN,
  responseOrErrorType,
  withGravityMutationError,
} from "./mutationHelpers"

const isPrimaryField = {
  type: GraphQLBoolean,
  description:
    "Makes this the primary email and demotes the previous one. A contact may have no primary email.",
}

const CreateResponseOrErrorType = responseOrErrorType({
  name: "CreateCRMContactEmail",
  payloadField: "crmContactEmail",
  payloadType: CRMContactEmailType,
})

export const createCRMContactEmailMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateCRMContactEmail",
  description:
    "Add an email address to a CRM contact. It must be unique across all of the partner's contacts, archived ones included.",
  inputFields: {
    crmContactID: { type: new GraphQLNonNull(GraphQLString) },
    address: { type: new GraphQLNonNull(GraphQLString) },
    isPrimary: isPrimaryField,
  },
  outputFields: {
    crmContactEmailOrError: {
      type: CreateResponseOrErrorType,
      description: "On success: the created email",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { crmContactID, address, isPrimary },
    { createCrmContactEmailLoader }
  ) => {
    if (!createCrmContactEmailLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      createCrmContactEmailLoader({
        crm_contact_id: crmContactID,
        address,
        is_primary: isPrimary,
      })
    )
  },
})

const UpdateResponseOrErrorType = responseOrErrorType({
  name: "UpdateCRMContactEmail",
  payloadField: "crmContactEmail",
  payloadType: CRMContactEmailType,
})

export const updateCRMContactEmailMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateCRMContactEmail",
  description:
    "Change an email's address or primary flag. An email can't be moved to another contact.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the email",
    },
    address: { type: GraphQLString },
    isPrimary: isPrimaryField,
  },
  outputFields: {
    crmContactEmailOrError: {
      type: UpdateResponseOrErrorType,
      description: "On success: the updated email",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, address, isPrimary },
    { updateCrmContactEmailLoader }
  ) => {
    if (!updateCrmContactEmailLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      updateCrmContactEmailLoader(id, { address, is_primary: isPrimary })
    )
  },
})

const DeleteResponseOrErrorType = responseOrErrorType({
  name: "DeleteCRMContactEmail",
  payloadField: "crmContactEmail",
  payloadType: CRMContactEmailType,
})

export const deleteCRMContactEmailMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteCRMContactEmail",
  description:
    "Remove an email from a CRM contact. Fails when it is the contact's last email and the contact has no name or company.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the email",
    },
  },
  outputFields: {
    crmContactEmailOrError: {
      type: DeleteResponseOrErrorType,
      description: "On success: the removed email",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteCrmContactEmailLoader }) => {
    if (!deleteCrmContactEmailLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() => deleteCrmContactEmailLoader(id))
  },
})
