import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ErrorsType } from "lib/gravityErrorHandler"

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
    emailFrom: {
      type: GraphQLString,
      description: "Email of the source user.",
    },
    emailTo: {
      type: GraphQLString,
      description: "Email of the destination user.",
    },
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
      throw new Error(
        "You need to be signed in as an admin to perform this action"
      )
    }

    try {
      const response = await transferMyCollectionLoader({
        email_from: args.emailFrom,
        email_to: args.emailTo,
        id_from: args.idFrom,
        id_to: args.idTo,
      })

      return { count: response.count }
    } catch (error) {
      const { body } = error as any
      return {
        errors: body?.errors ?? [{ code: "unknown", message: String(error) }],
      }
    }
  },
})
