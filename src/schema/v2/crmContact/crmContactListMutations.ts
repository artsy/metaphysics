import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { CRMContactListType } from "./crmContactList"
import {
  NOT_SIGNED_IN,
  responseOrErrorType,
  withGravityMutationError,
} from "./mutationHelpers"

const contactIDField = {
  type: new GraphQLNonNull(GraphQLString),
  description: "CRM contact ID. Contacts of other partners are not found.",
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
    "Create a CRM contact list. The name must be unique within the partner, ignoring case.",
  inputFields: {
    partnerID: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
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

export const addCRMContactToListMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "AddCRMContactToList",
  description:
    "Add a contact to a CRM contact list. Adding a contact already in it changes nothing.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the list",
    },
    contactID: contactIDField,
  },
  outputFields: listOrErrorField(
    "AddCRMContactToList",
    "On success: the updated list"
  ),
  mutateAndGetPayload: async (
    { id, contactID },
    { addCrmContactToListLoader }
  ) => {
    if (!addCrmContactToListLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      addCrmContactToListLoader({ listId: id, contactId: contactID })
    )
  },
})

export const removeCRMContactFromListMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "RemoveCRMContactFromList",
  description:
    "Remove a contact from a CRM contact list. The contact is not deleted.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the list",
    },
    contactID: contactIDField,
  },
  outputFields: listOrErrorField(
    "RemoveCRMContactFromList",
    "On success: the updated list"
  ),
  mutateAndGetPayload: async (
    { id, contactID },
    { removeCrmContactFromListLoader }
  ) => {
    if (!removeCrmContactFromListLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      removeCrmContactFromListLoader({ listId: id, contactId: contactID })
    )
  },
})
