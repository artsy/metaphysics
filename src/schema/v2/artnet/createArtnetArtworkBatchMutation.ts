import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { snakeCaseKeys } from "lib/helpers"
import { ResolverContext } from "types/graphql"

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

interface ArtnetArtworkBatchPayloadProps {
  published?: boolean | null
  priceCurrencyCode?: string | null
  priceFrom?: number | null
  priceTo?: number | null
}

// Limited to the fields Gravity persists on an ArtnetArtwork (published, price currency and
// range). Gravity's BuildWireOperation accepts more, but those fields are intentionally not
// exposed here.
const ArtnetArtworkBatchOperationPayloadInputType = new GraphQLInputObjectType({
  name: "ArtnetArtworkBatchOperationPayloadInput",
  description:
    "The ArtnetArtwork fields to set on a Create or change on an Edit. On Edit, omitted fields are left untouched. Ignored for Delete/Publish/Unpublish.",
  fields: {
    published: {
      type: GraphQLBoolean,
      description: "Whether the artwork should be published. Edit and Create.",
    },
    priceCurrencyCode: {
      type: GraphQLString,
      description: "Currency code for the price range, e.g. USD. Create only.",
    },
    priceFrom: {
      type: GraphQLFloat,
      description: "Low end of the price range, in major units. Create only.",
    },
    priceTo: {
      type: GraphQLFloat,
      description: "High end of the price range, in major units. Create only.",
    },
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
      type: ArtnetArtworkBatchOperationPayloadInputType,
      description: "The artwork fields; only used by CREATE and EDIT.",
    },
  },
})

interface CreateArtnetArtworkBatchMutationInputProps {
  partnerID: string
  operations: Array<{
    actionType: string
    artworkID?: string
    payload?: ArtnetArtworkBatchPayloadProps | null
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
    "Submits a batch of gallery-artwork create/edit/delete/publish/unpublish operations to Artnet.",
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
          payload: payload ? snakeCaseKeys(payload) : undefined,
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
