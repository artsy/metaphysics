import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ErrorsType, formatGravityError } from "lib/gravityErrorHandler"

const TransferMyCollectionSuccessType = new GraphQLObjectType({
  name: "TransferMyCollectionSuccess",
  fields: {
    count: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Number of transferred artworks.",
    },
  },
})

const TransferMyCollectionSuccessOrErrorsUnionType = new GraphQLUnionType({
  name: "TransferMyCollectionSuccessOrErrorsUnion",
  types: [ErrorsType, TransferMyCollectionSuccessType],
  resolveType: (value) => {
    if ("errors" in value) {
      return ErrorsType
    }
    return TransferMyCollectionSuccessType
  },
})

export const transferMyCollectionMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "TransferMyCollection",
  description: "Transfers My Collection artworks from one user to another.",
  inputFields: {
    idFrom: {
      type: GraphQLString,
      description: "ID of the source user.",
    },
    idTo: {
      type: GraphQLString,
      description: "ID of the destination user.",
    },
  },
  outputFields: {
    artworkCountOrError: {
      type: new GraphQLNonNull(TransferMyCollectionSuccessOrErrorsUnionType),
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { transferMyCollectionLoader }) => {
    if (!transferMyCollectionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await transferMyCollectionLoader({
        id_from: args.idFrom,
        id_to: args.idTo,
      })

      return { count: response.count }
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { errors: [{ message: formattedErr.message }] }
      } else {
        throw error
      }
    }
  },
})
