import { GraphQLString, GraphQLList, GraphQLInt } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { GraphQLNonNull } from "graphql"
import { MyCollectionArtworkMutationType } from "./myCollection"
import { formatGravityError } from "lib/gravityErrorHandler"

export const myCollectionCreateArtworkMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MyCollectionCreateArtwork",
  description: "Create an artwork in my collection",
  inputFields: {
    artistIds: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
    },
    medium: {
      type: new GraphQLNonNull(GraphQLString),
    },

    // Optional
    category: {
      type: GraphQLString,
    },
    costCurrencyCode: {
      type: GraphQLString,
    },
    costMinor: {
      type: GraphQLInt,
    },
    date: {
      type: GraphQLString,
    },
    depth: {
      type: GraphQLString,
    },
    editionNumber: {
      type: GraphQLString,
    },
    editionSize: {
      type: GraphQLString,
    },
    height: {
      type: GraphQLString,
    },
    metric: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
    width: {
      type: GraphQLString,
    },
  },
  outputFields: {
    artworkOrError: {
      type: MyCollectionArtworkMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      artistIds,
      costCurrencyCode,
      costMinor,
      editionSize,
      editionNumber,
      ...rest
    },
    { myCollectionCreateArtworkLoader }
  ) => {
    if (!myCollectionCreateArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await myCollectionCreateArtworkLoader({
        artists: artistIds,
        cost_currency_code: costCurrencyCode,
        cost_minor: costMinor,
        edition_size: editionSize,
        edition_number: editionNumber,
        ...rest,
      })

      return response
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
