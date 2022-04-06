import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ArtworkImportSourceEnum } from "../artwork"
import { MyCollectionArtworkMutationType } from "./myCollection"

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

export const ArtworkAttributionClassEnum = new GraphQLEnumType({
  name: "ArtworkAttributionClassType",
  values: {
    LIMITED_EDITION: {
      value: "limited edition",
    },
    OPEN_EDITION: {
      value: "open edition",
    },
    UNIQUE: {
      value: "unique",
    },
    UNKNOWN_EDITION: {
      value: "unknown edition",
    },
  },
})

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
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },

    // Optional
    importSource: {
      type: ArtworkImportSourceEnum,
    },
    submissionId: {
      type: GraphQLString,
    },
    medium: {
      type: GraphQLString,
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
    artworkLocation: {
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
    width: {
      type: GraphQLString,
    },
    attributionClass: {
      type: ArtworkAttributionClassEnum,
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
      submissionId,
      costCurrencyCode,
      costMinor,
      isEdition,
      editionSize,
      editionNumber,
      externalImageUrls = [],
      artworkLocation,
      pricePaidCents,
      pricePaidCurrency,
      attributionClass,
      importSource,
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
        submission_id: submissionId,
        collection_id: "my-collection",
        cost_currency_code: costCurrencyCode,
        cost_minor: costMinor,
        price_paid_cents: pricePaidCents,
        price_paid_currency: pricePaidCurrency,
        artwork_location: artworkLocation,
        attribution_class: attributionClass,
        import_source: importSource,
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
