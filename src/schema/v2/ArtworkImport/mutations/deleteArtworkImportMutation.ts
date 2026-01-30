import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtworkImportSuccess",
  isTypeOf: (data) => data.queued !== undefined,
  fields: () => ({
    queued: {
      type: GraphQLBoolean,
      resolve: ({ queued }) => queued,
      description:
        "Whether the deletion job has been queued. Deletion happens asynchronously in the background.",
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtworkImportFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteArtworkImportResponseOrError",
  types: [SuccessType, FailureType],
})

export const DeleteArtworkImportMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteArtworkImport",
  description:
    "Queues an asynchronous job to delete an artwork import and associated unpublished artworks. Published artworks are preserved. Deletion happens in the background and results are sent via WebSocket.",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    artworkImportOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { deleteArtworkImportLoader }) => {
    if (!deleteArtworkImportLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const result = await deleteArtworkImportLoader(args.artworkImportID)
      return result
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
