import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { CRMActivityKindEnum, CRMActivityType } from "./crmActivity"
import {
  NOT_SIGNED_IN,
  responseOrErrorType,
  withGravityMutationError,
} from "./mutationHelpers"

const CreateResponseOrErrorType = responseOrErrorType({
  name: "CreateCRMActivity",
  payloadField: "crmActivity",
  payloadType: CRMActivityType,
})

export const createCRMActivityMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateCRMActivity",
  description:
    "Add an activity to a CRM contact's timeline. Only notes can be created for now.",
  inputFields: {
    crmContactID: { type: new GraphQLNonNull(GraphQLString) },
    description: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Text of the activity",
    },
    kind: {
      type: new GraphQLNonNull(CRMActivityKindEnum),
      description: "Kind of activity. Only NOTE is accepted for now",
    },
    subject: {
      type: GraphQLString,
      description: "Short title",
    },
  },
  outputFields: {
    crmActivityOrError: {
      type: CreateResponseOrErrorType,
      description: "On success: the created activity",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { crmContactID, description, kind, subject },
    { createCrmActivityLoader }
  ) => {
    if (!createCrmActivityLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      createCrmActivityLoader({
        crm_contact_id: crmContactID,
        description,
        kind,
        subject,
      })
    )
  },
})

const UpdateResponseOrErrorType = responseOrErrorType({
  name: "UpdateCRMActivity",
  payloadField: "crmActivity",
  payloadType: CRMActivityType,
})

export const updateCRMActivityMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateCRMActivity",
  description:
    "Change an activity's subject or description. Email activities can't be changed.",
  inputFields: {
    description: {
      type: GraphQLString,
      description: "Text of the activity",
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the activity",
    },
    subject: {
      type: GraphQLString,
      description: "Short title",
    },
  },
  outputFields: {
    crmActivityOrError: {
      type: UpdateResponseOrErrorType,
      description: "On success: the updated activity",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { description, id, subject },
    { updateCrmActivityLoader }
  ) => {
    if (!updateCrmActivityLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      updateCrmActivityLoader(id, { description, subject })
    )
  },
})

const DeleteResponseOrErrorType = responseOrErrorType({
  name: "DeleteCRMActivity",
  payloadField: "crmActivity",
  payloadType: CRMActivityType,
})

export const deleteCRMActivityMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteCRMActivity",
  description:
    "Remove an activity from a CRM contact's timeline. Email activities can't be removed.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the activity",
    },
  },
  outputFields: {
    crmActivityOrError: {
      type: DeleteResponseOrErrorType,
      description: "On success: the removed activity",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteCrmActivityLoader }) => {
    if (!deleteCrmActivityLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() => deleteCrmActivityLoader(id))
  },
})
