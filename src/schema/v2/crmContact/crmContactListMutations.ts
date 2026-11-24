import {
  GraphQLError,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { CRMContactListType } from "./crmContactList"
import {
  NOT_SIGNED_IN,
  responseOrErrorType,
  withGravityMutationError,
} from "./mutationHelpers"

const NO_CONTACT_IDS = "contactIDs must include at least one ID"

const contactIDsField = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
  description: "CRM contact IDs. IDs of other partners’ contacts are ignored.",
}

const listOrErrorField = (name: string, description: string) => ({
  crmContactListOrError: {
    type: responseOrErrorType({
      name,
      payloadField: "crmContactList",
      payloadType: CRMContactListType,
    }),
    description,
    resolve: (result) => result,
  },
})

export const createCRMContactListMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateCRMContactList",
  description:
    "Create a CRM contact list, optionally with its first contacts. The name must be unique within the partner, ignoring case.",
  inputFields: {
    partnerID: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    contactIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "Contacts to add to the new list",
    },
  },
  outputFields: listOrErrorField(
    "CreateCRMContactList",
    "On success: the created list"
  ),
  mutateAndGetPayload: async (input, { createCrmContactListLoader }) => {
    if (!createCrmContactListLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      createCrmContactListLoader({
        partner_id: input.partnerID,
        name: input.name,
        description: input.description,
        crm_contact_ids: input.contactIDs?.length
          ? input.contactIDs
          : undefined,
      })
    )
  },
})

export const updateCRMContactListMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateCRMContactList",
  description: "Rename a CRM contact list or change its description",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the list",
    },
    name: { type: GraphQLString },
    description: {
      type: GraphQLString,
      description: "An empty string clears the description",
    },
  },
  outputFields: listOrErrorField(
    "UpdateCRMContactList",
    "On success: the updated list"
  ),
  mutateAndGetPayload: async (input, { updateCrmContactListLoader }) => {
    if (!updateCrmContactListLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      updateCrmContactListLoader(input.id, {
        name: input.name,
        description: input.description,
      })
    )
  },
})

export const deleteCRMContactListMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteCRMContactList",
  description: "Delete a CRM contact list. Its contacts are not deleted.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the list",
    },
  },
  outputFields: listOrErrorField(
    "DeleteCRMContactList",
    "On success: the deleted list"
  ),
  mutateAndGetPayload: async ({ id }, { deleteCrmContactListLoader }) => {
    if (!deleteCrmContactListLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() => deleteCrmContactListLoader(id))
  },
})

export const addCRMContactsToListMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "AddCRMContactsToList",
  description:
    "Add contacts to a CRM contact list. Contacts already in it are skipped.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the list",
    },
    contactIDs: contactIDsField,
  },
  outputFields: listOrErrorField(
    "AddCRMContactsToList",
    "On success: the updated list"
  ),
  mutateAndGetPayload: async (
    { id, contactIDs },
    { addCrmContactsToListLoader }
  ) => {
    if (!addCrmContactsToListLoader) throw new Error(NOT_SIGNED_IN)
    if (contactIDs.length === 0) throw new GraphQLError(NO_CONTACT_IDS)

    return withGravityMutationError(() =>
      addCrmContactsToListLoader(id, { crm_contact_ids: contactIDs })
    )
  },
})

export const removeCRMContactsFromListMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "RemoveCRMContactsFromList",
  description:
    "Remove contacts from a CRM contact list. The contacts are not deleted.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the list",
    },
    contactIDs: contactIDsField,
  },
  outputFields: listOrErrorField(
    "RemoveCRMContactsFromList",
    "On success: the updated list"
  ),
  mutateAndGetPayload: async (
    { id, contactIDs },
    { removeCrmContactsFromListLoader }
  ) => {
    if (!removeCrmContactsFromListLoader) throw new Error(NOT_SIGNED_IN)
    if (contactIDs.length === 0) throw new GraphQLError(NO_CONTACT_IDS)

    return withGravityMutationError(() =>
      removeCrmContactsFromListLoader(id, { crm_contact_ids: contactIDs })
    )
  },
})
