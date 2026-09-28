import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import GraphQLJSON from "graphql-type-json"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

// Create is included here for schema parity with Gravity's own action_type vocabulary,
// but Gravity's endpoint still rejects any batch containing a Create operation with a
// 400 until it has a way to persist the resulting artnet artwork id (see
// ArtnetArtworkBatchesEndpoint on the Gravity side) — sending CREATE will not work yet.
export const ArtnetArtworkBatchActionType = new GraphQLEnumType({
  name: "ArtnetArtworkBatchActionType",
  values: {
    CREATE: { value: "Create" },
    EDIT: { value: "Edit" },
    DELETE: { value: "Delete" },
    PUBLISH: { value: "Publish" },
    UNPUBLISH: { value: "Unpublish" },
  },
})

const ArtnetArtworkBatchOperationInputType = new GraphQLInputObjectType({
  name: "ArtnetArtworkBatchOperationInput",
  fields: {
    actionType: {
      type: new GraphQLNonNull(ArtnetArtworkBatchActionType),
    },
    artworkID: {
      type: GraphQLString,
      description:
        "Artnet's artwork guid; required for every action type except Create",
    },
    payload: {
      type: GraphQLJSON,
      description:
        "Gravity's own snake_case fields for the operation (see ArtnetBulkUploadService::BuildWireOperation on the Gravity side for the exact mapping to Artnet's wire shape); ignored for Delete/Publish/Unpublish.",
    },
  },
})

interface CreateArtnetArtworkBatchMutationInputProps {
  partnerID: string
  operations: Array<{
    actionType: string
    artworkID?: string
    payload?: Record<string, unknown>
  }>
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtnetArtworkBatchSuccess",
  isTypeOf: (data) => !!data.batchID,
  fields: () => ({
    batchID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    taskIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtnetArtworkBatchFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtnetArtworkBatchResponseOrError",
  types: [SuccessType, FailureType],
})

export const createArtnetArtworkBatchMutation = mutationWithClientMutationId<
  CreateArtnetArtworkBatchMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreateArtnetArtworkBatchMutation",
  description:
    "Submits a batch of gallery-artwork edit/delete/publish/unpublish operations to Artnet.",
  inputFields: {
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The ID of the partner these operations are being submitted for",
    },
    operations: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(ArtnetArtworkBatchOperationInputType)
        )
      ),
      description: "The gallery-artwork operations to submit",
    },
  },
  outputFields: {
    artnetArtworkBatchOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the submitted batch and task ids. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerID, operations },
    { createArtnetArtworkBatchLoader }
  ) => {
    if (!createArtnetArtworkBatchLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const result = await createArtnetArtworkBatchLoader({
        partner_id: partnerID,
        operations: operations.map(({ actionType, artworkID, payload }) => ({
          action_type: actionType,
          artwork_id: artworkID,
          payload,
        })),
      })

      return { batchID: result.batch_id, taskIDs: result.task_ids }
    } catch (error) {
      const formatted = formatGravityError(error)
      if (formatted) {
        return { ...formatted, _type: "GravityMutationError" }
      }
      throw error
    }
  },
})
