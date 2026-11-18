import { GraphQLList, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { CRMActivityKindEnum, CRMActivityType } from "./crmActivity"
import {
  NOT_SIGNED_IN,
  responseOrErrorType,
  withGravityMutationError,
} from "./mutationHelpers"

const occurredAtField = {
  type: GraphQLString,
  description: "ISO 8601 time the activity happened. Defaults to now on create",
}

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
    "Add an activity to a CRM contact's timeline. Email activities can't be created.",
  inputFields: {
    artistIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "Artists of the partner that the activity is about. An INTEREST needs an artwork or an artist",
    },
    artworkIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "Artworks of the partner that the activity is about",
    },
    crmContactID: { type: new GraphQLNonNull(GraphQLString) },
    description: {
      type: GraphQLString,
      description: "Required for NOTE",
    },
    kind: {
      type: new GraphQLNonNull(CRMActivityKindEnum),
      description: "Kind of activity. EMAIL is not accepted",
    },
    occurredAt: occurredAtField,
    subject: {
      type: GraphQLString,
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
    {
      artistIDs,
      artworkIDs,
      crmContactID,
      description,
      kind,
      occurredAt,
      subject,
    },
    { createCrmActivityLoader }
  ) => {
    if (!createCrmActivityLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      createCrmActivityLoader({
        artist_ids: artistIDs ?? undefined,
        artwork_ids: artworkIDs ?? undefined,
        crm_contact_id: crmContactID,
        description,
        kind,
        occurred_at: occurredAt,
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
  description: "Change an activity. Email activities can't be changed.",
  inputFields: {
    artistIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "Replaces the artists the activity is about. An empty list clears them, leaving it out keeps them",
    },
    artworkIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "Replaces the artworks the activity is about. An empty list clears them, leaving it out keeps them",
    },
    description: {
      type: GraphQLString,
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the activity",
    },
    kind: {
      type: CRMActivityKindEnum,
      description: "Switch between NOTE, CALL, MEETING and INTEREST",
    },
    occurredAt: occurredAtField,
    subject: {
      type: GraphQLString,
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
    { artistIDs, artworkIDs, description, id, kind, occurredAt, subject },
    { updateCrmActivityLoader }
  ) => {
    if (!updateCrmActivityLoader) throw new Error(NOT_SIGNED_IN)

    return withGravityMutationError(() =>
      updateCrmActivityLoader(id, {
        artist_ids: artistIDs ?? undefined,
        artwork_ids: artworkIDs ?? undefined,
        description,
        kind,
        occurred_at: occurredAt,
        subject,
      })
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
