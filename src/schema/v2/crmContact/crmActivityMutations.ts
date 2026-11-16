import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { CRMActivityType } from "./crmActivity"
import {
  NOT_SIGNED_IN,
  responseOrErrorType,
  withGravityMutationError,
} from "./mutationHelpers"

const occurredAtField = {
  type: GraphQLString,
  description: "ISO 8601 time the note happened. Defaults to now on create.",
}

const CreateResponseOrErrorType = responseOrErrorType({
  name: "CreateCRMActivityNote",
  payloadField: "crmActivity",
  payloadType: CRMActivityType,
})

export const createCRMActivityNoteMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateCRMActivityNote",
  description: "Add a note to a CRM contact's timeline.",
  inputFields: {
    crmContactID: { type: new GraphQLNonNull(GraphQLString) },
    subject: { type: GraphQLString },
    description: { type: new GraphQLNonNull(GraphQLString) },
    occurredAt: occurredAtField,
  },
  outputFields: {
    crmActivityOrError: {
      type: CreateResponseOrErrorType,
      description: "On success: the created note",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { crmContactID, subject, description, occurredAt },
    { createCrmActivityLoader }
  ) => {
    if (!createCrmActivityLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      createCrmActivityLoader({
        crm_contact_id: crmContactID,
        kind: "note",
        subject,
        description,
        occurred_at: occurredAt,
      })
    )
  },
})

const UpdateResponseOrErrorType = responseOrErrorType({
  name: "UpdateCRMActivityNote",
  payloadField: "crmActivity",
  payloadType: CRMActivityType,
})

export const updateCRMActivityNoteMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateCRMActivityNote",
  description:
    "Change a note's text or time. Email activities can't be changed.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the note",
    },
    subject: { type: GraphQLString },
    description: { type: GraphQLString },
    occurredAt: occurredAtField,
  },
  outputFields: {
    crmActivityOrError: {
      type: UpdateResponseOrErrorType,
      description: "On success: the updated note",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, subject, description, occurredAt },
    { updateCrmActivityLoader }
  ) => {
    if (!updateCrmActivityLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      updateCrmActivityLoader(id, {
        subject,
        description,
        occurred_at: occurredAt,
      })
    )
  },
})

const DeleteResponseOrErrorType = responseOrErrorType({
  name: "DeleteCRMActivityNote",
  payloadField: "crmActivity",
  payloadType: CRMActivityType,
})

export const deleteCRMActivityNoteMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteCRMActivityNote",
  description: "Remove a note from a CRM contact's timeline.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the note",
    },
  },
  outputFields: {
    crmActivityOrError: {
      type: DeleteResponseOrErrorType,
      description: "On success: the removed note",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteCrmActivityLoader }) => {
    if (!deleteCrmActivityLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() => deleteCrmActivityLoader(id))
  },
})
