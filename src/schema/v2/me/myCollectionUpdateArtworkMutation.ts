import {
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { MyCollectionArtworkMutationType } from "./myCollection"
import { formatGravityError } from "lib/gravityErrorHandler"
import { computeImageSources } from "./myCollectionCreateArtworkMutation"

interface MyCollectionArtworkUpdateMutationInput {
  artworkId: string
  artistIds?: [string]
  category?: string
  costCurrencyCode?: string
  costMinor?: number
  date?: string
  depth?: string
  isEdition?: boolean
  editionNumber?: string
  editionSize?: string
  externalImageUrls?: [string]
  pricePaidCents?: number
  pricePaidCurrency?: string
}

export const myCollectionUpdateArtworkMutation = mutationWithClientMutationId<
  MyCollectionArtworkUpdateMutationInput,
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
    medium: {
      type: GraphQLString,
    },
    metric: {
      type: GraphQLString,
    },
    pricePaidCents: {
      type: GraphQLInt,
    },
    pricePaidCurrency: {
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
      isEdition,
      editionNumber,
      editionSize,
      externalImageUrls = [],
      pricePaidCents,
      pricePaidCurrency,
      ...rest
    },
    {
      updateArtworkLoader,
      createArtworkImageLoader,
      createArtworkEditionSetLoader,
      deleteArtworkEditionSetLoader,
      updateArtworkEditionSetLoader,
    }
  ) => {
    if (
      !updateArtworkLoader ||
      !createArtworkImageLoader ||
      !createArtworkEditionSetLoader ||
      !deleteArtworkEditionSetLoader ||
      !updateArtworkEditionSetLoader
    ) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await updateArtworkLoader(artworkId, {
        artists: artistIds,
        cost_currency_code: costCurrencyCode,
        cost_minor: costMinor,
        price_paid_cents: pricePaidCents,
        price_paid_currency: pricePaidCurrency,
        ...rest,
      })

      if (!response.edition_sets?.length) {
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
      } else {
        const editionSetId = response.edition_sets[0].id

        if (isEdition === false) {
          await deleteArtworkEditionSetLoader({ artworkId, editionSetId })
        } else {
          const payload = {
            edition_size: editionSize ? editionSize : null,
            // TODO: Is there a better way to clear out edition number?
            available_editions: editionNumber ? [editionNumber] : [""],
          }

          await updateArtworkEditionSetLoader(
            { artworkId, editionSetId },
            payload
          )
        }
      }

      const imageSources = computeImageSources(externalImageUrls)

      for (const imageSource of imageSources) {
        await createArtworkImageLoader(artworkId, imageSource)
      }

      return {
        ...response,
        id: artworkId,
      }
    } catch (e) {
      const formattedErr = formatGravityError(e)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(e)
      }
    }
  },
})
