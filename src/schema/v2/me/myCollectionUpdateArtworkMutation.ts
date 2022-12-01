import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { MyCollectionArtworkMutationType } from "./myCollection"
import {
  ArtworkAttributionClassEnum,
  computeImageSources,
  transformToPricePaidCents,
} from "./myCollectionCreateArtworkMutation"
import { EditableLocationFields } from "./update_me_mutation"

interface MyCollectionArtworkUpdateMutationInput {
  artworkId: string
  artistIds?: [string]
  attributionClass?: string
  category?: string
  costCurrencyCode?: string
  costMajor?: number
  costMinor?: number
  date?: string
  depth?: string
  isEdition?: boolean
  editionNumber?: string
  editionSize?: string
  externalImageUrls?: [string]
  artworkLocation?: string
  collectorLocation?: Record<string, string>
  pricePaidCents?: number
  pricePaidCurrency?: string
  submissionId?: string
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
    attributionClass: {
      type: ArtworkAttributionClassEnum,
    },
    category: {
      type: GraphQLString,
    },
    costCurrencyCode: {
      type: GraphQLString,
    },
    costMajor: {
      type: GraphQLInt,
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
    artworkLocation: {
      type: GraphQLString,
    },
    collectorLocation: {
      description: "The given location of the user as structured data",
      type: EditableLocationFields,
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
    submissionId: {
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
      artworkId,
      artworkLocation,
      attributionClass,
      collectorLocation,
      costCurrencyCode,
      costMajor,
      costMinor,
      editionNumber,
      editionSize,
      externalImageUrls = [],
      isEdition,
      pricePaidCents,
      pricePaidCurrency,
      submissionId,
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

    const transformedPricePaidCents = transformToPricePaidCents({
      costMajor,
      costMinor,
      pricePaidCents,
    })

    try {
      const response = await updateArtworkLoader(artworkId, {
        artists: artistIds,
        cost_currency_code: costCurrencyCode,
        cost_minor: costMinor,
        artwork_location: artworkLocation,
        collector_location: collectorLocation,
        price_paid_cents: transformedPricePaidCents,
        price_paid_currency: pricePaidCurrency,
        attribution_class: attributionClass,
        submission_id: submissionId,
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
          await deleteArtworkEditionSetLoader({
            artworkId,
            editionSetId,
          })
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
