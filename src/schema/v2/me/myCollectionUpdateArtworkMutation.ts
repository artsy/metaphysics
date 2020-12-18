import { GraphQLString, GraphQLList, GraphQLNonNull, GraphQLInt } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { MyCollectionArtworkMutationType } from "./myCollection"
import { formatGravityError } from "lib/gravityErrorHandler"
import { computeImageSources } from "./myCollectionCreateArtworkMutation"

export const myCollectionUpdateArtworkMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MyCollectionUpdateArtwork",
  description: "Update an artwork in my collection",
  inputFields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artistIds: {
      type: new GraphQLList(GraphQLString),
    },
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
    externalImageUrls: {
      type: new GraphQLList(GraphQLString),
    },
    height: {
      type: GraphQLString,
    },
    medium: {
      type: GraphQLString,
    },
    metric: {
      type: GraphQLString,
    },
    provenance: {
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
      artworkId,
      artistIds,
      costCurrencyCode,
      costMinor,
      editionNumber,
      editionSize,
      externalImageUrls = [],
      ...rest
    },
    {
      updateArtworkLoader,
      createArtworkImageLoader,
      createArtworkEditionSetLoader,
      updateArtworkEditionSetLoader,
    }
  ) => {
    if (
      !updateArtworkLoader ||
      !createArtworkImageLoader ||
      !createArtworkEditionSetLoader ||
      !updateArtworkEditionSetLoader
    ) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await updateArtworkLoader(artworkId, {
        artists: artistIds,
        cost_currency_code: costCurrencyCode,
        cost_minor: costMinor,
        ...rest,
      })

      if (!response.edition_sets?.length) {
        if (editionSize || editionNumber) {
          // create new edition set when none existed previously
          await createArtworkEditionSetLoader(artworkId, {
            edition_size: editionSize,
            available_editions: editionNumber ? [editionNumber] : null,
          })
        }
      } else {
        const editionSetId = response.edition_sets[0].id
        await updateArtworkEditionSetLoader(
          { artworkId, editionSetId },
          {
            edition_size: editionSize,
            available_editions: editionNumber ? [editionNumber] : null,
          }
        )
      }

      const imageSources = computeImageSources(externalImageUrls)

      for (const imageSource of imageSources) {
        await createArtworkImageLoader(artworkId, imageSource)
      }

      return {
        ...response,
        id: artworkId,
      }
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
