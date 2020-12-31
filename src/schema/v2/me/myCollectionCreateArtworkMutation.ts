import { GraphQLString, GraphQLList, GraphQLInt, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { GraphQLNonNull } from "graphql"
import { MyCollectionArtworkMutationType } from "./myCollection"
import { formatGravityError } from "lib/gravityErrorHandler"

const externalUrlRegex = /https:\/\/(?<sourceBucket>.*).s3.amazonaws.com\/(?<sourceKey>.*)/

export const computeImageSources = (externalImageUrls) => {
  const imageSources = externalImageUrls.map((url) => {
    const match = url.match(externalUrlRegex)

    if (!match) return

    const { sourceBucket, sourceKey } = match.groups

    return {
      source_bucket: sourceBucket,
      source_key: sourceKey,
    }
  })

  const filteredImageSources = imageSources.filter(Boolean)
  return filteredImageSources
}

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
    isEdition: {
      type: GraphQLBoolean,
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
      artistIds,
      costCurrencyCode,
      costMinor,
      isEdition,
      editionSize,
      editionNumber,
      externalImageUrls = [],
      ...rest
    },
    {
      createArtworkLoader,
      createArtworkImageLoader,
      createArtworkEditionSetLoader,
    }
  ) => {
    if (
      !createArtworkLoader ||
      !createArtworkImageLoader ||
      !createArtworkEditionSetLoader
    ) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await createArtworkLoader({
        artists: artistIds,
        collection_id: "my-collection",
        cost_currency_code: costCurrencyCode,
        cost_minor: costMinor,
        ...rest,
      })

      const artworkId = response.id

      if (isEdition === true || editionNumber || editionSize) {
        // create edition set for artwork
        const payload = {}
        if (editionSize) {
          payload["edition_size"] = editionSize
        }

        if (editionNumber) {
          payload["available_editions"] = [editionNumber]
        }

        await createArtworkEditionSetLoader(artworkId, payload)
      }

      const imageSources = computeImageSources(externalImageUrls)

      for (const imageSource of imageSources) {
        await createArtworkImageLoader(artworkId, imageSource)
      }

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
