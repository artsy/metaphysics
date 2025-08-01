import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLLong } from "lib/customTypes/GraphQLLong"
import { formatGravityError } from "lib/gravityErrorHandler"
import { snakeCaseKeys } from "lib/helpers"
import { StaticPathLoader } from "lib/loaders/api/loader_interface"
import { ResolverContext } from "types/graphql"
import { ArtworkImportSourceEnum } from "../artwork"
import { MyCollectionArtworkMutationType } from "./myCollection"
import { EditableLocationFields } from "./update_me_mutation"
import {
  ArtworkSignatureTypeEnum,
  transformSignatureFieldsToGravityFields,
} from "../artwork/artworkSignatureTypes"
import { ArtworkConditionEnum } from "../artwork/artworkCondition"

export const externalUrlRegex = /https:\/\/(?<sourceBucket>.*).s3.amazonaws.com\/(?<sourceKey>.*)/

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

const MyCollectionArtistInputType = new GraphQLInputObjectType({
  name: "MyCollectionArtistInput",
  fields: {
    displayName: {
      type: GraphQLString,
      description: "The artist's display name.",
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
    additionalInformation: {
      type: GraphQLString,
    },
    artistIds: {
      type: new GraphQLList(GraphQLString),
    },
    artists: {
      type: new GraphQLList(MyCollectionArtistInputType),
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    coaByAuthenticatingBody: {
      type: GraphQLBoolean,
    },
    coaByGallery: {
      type: GraphQLBoolean,
    },
    condition: {
      type: ArtworkConditionEnum,
    },
    confidentialNotes: {
      type: GraphQLString,
    },
    importSource: {
      type: ArtworkImportSourceEnum,
    },
    hasCertificateOfAuthenticity: {
      type: GraphQLBoolean,
    },
    isFramed: {
      type: GraphQLBoolean,
    },
    framedDepth: {
      type: GraphQLString,
    },
    framedHeight: {
      type: GraphQLString,
    },
    framedMetric: {
      type: GraphQLString,
    },
    framedWidth: {
      type: GraphQLString,
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
    conditionDescription: {
      type: GraphQLString,
    },
    metric: {
      type: GraphQLString,
    },
    pricePaidCents: {
      description:
        "The price paid for the MyCollection artwork in cents for any given currency",
      type: GraphQLLong,
    },
    pricePaidCurrency: {
      type: GraphQLString,
    },
    provenance: {
      type: GraphQLString,
    },
    signatureDetails: {
      type: GraphQLString,
    },
    signatureTypes: {
      type: new GraphQLList(ArtworkSignatureTypeEnum),
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
      additionalInformation,
      artistIds,
      artists,
      artworkLocation,
      attributionClass,
      coaByAuthenticatingBody,
      coaByGallery,
      collectorLocation,
      condition,
      conditionDescription,
      confidentialNotes,
      costCurrencyCode,
      costMajor,
      costMinor,
      editionNumber,
      editionSize,
      externalImageUrls = [],
      hasCertificateOfAuthenticity,
      importSource,
      isEdition,
      isFramed,
      framedDepth,
      framedHeight,
      framedMetric,
      framedWidth,
      pricePaidCents,
      pricePaidCurrency,
      signatureDetails,
      signatureTypes,
      ...rest
    },
    {
      artworkLoader,
      createArtworkLoader,
      createArtworkImageLoader,
      createArtworkEditionSetLoader,
      createArtistLoader,
    }
  ) => {
    if (
      !artworkLoader ||
      !createArtworkLoader ||
      !createArtworkImageLoader ||
      !createArtworkEditionSetLoader ||
      !createArtistLoader
    ) {
      return new Error("You need to be signed in to perform this action")
    }

    if (!artistIds?.length && !artists?.length) {
      return new Error("You need to provide either artist IDs or artists")
    }

    // Create artists if `artist` is provided in the input fields
    if (artists?.length) {
      const newArtistIDs = await createArtists(artists, createArtistLoader)

      artistIds = [...(artistIds || []), ...newArtistIDs]
    }

    const transformedPricePaidCents = transformToPricePaidCents({
      costMajor,
      costMinor,
      pricePaidCents,
    })

    try {
      const response = await createArtworkLoader({
        additional_information: additionalInformation,
        artists: artistIds,
        certificate_of_authenticity: hasCertificateOfAuthenticity,
        coa_by_authenticating_body: coaByAuthenticatingBody,
        coa_by_gallery: coaByGallery,
        collection_id: "my-collection",
        condition: condition,
        condition_description: conditionDescription,
        confidential_notes: confidentialNotes,
        cost_currency_code: costCurrencyCode,
        cost_minor: costMinor,
        framed: isFramed,
        framed_depth: framedDepth,
        framed_height: framedHeight,
        framed_metric: framedMetric,
        framed_width: framedWidth,
        price_paid_cents: transformedPricePaidCents,
        price_paid_currency: pricePaidCurrency,
        artwork_location: artworkLocation,
        collector_location: collectorLocation,
        attribution_class: attributionClass,
        import_source: importSource,
        signature: signatureDetails,
        ...transformSignatureFieldsToGravityFields(signatureTypes),
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

      // Loading the artwork again to get the updated version with the new images
      return await artworkLoader(artworkId)
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

const createArtists = async (
  artists: { displayName: string }[],
  createArtistLoader: StaticPathLoader<any>
) => {
  const responses = await Promise.all(
    artists.map((artist) =>
      createArtistLoader({
        ...snakeCaseKeys(artist),
        is_personal_artist: true,
      })
    )
  )

  const artistIDs: string[] = responses.map(({ id }) => id)

  return artistIDs
}

export const computeImageSources = (externalImageUrls) => {
  const imageSources = externalImageUrls.map((url) => {
    const match = url.match(externalUrlRegex)

    if (!match) {
      if (url.startsWith("http")) {
        return {
          remote_image_url: url,
        }
      } else {
        return
      }
    }

    const { sourceBucket, sourceKey } = match.groups

    return {
      source_bucket: sourceBucket,
      source_key: sourceKey,
    }
  })

  const filteredImageSources = imageSources.filter(Boolean)
  return filteredImageSources
}

// This a temporary workaround to support the old way we were sending
// the price paid as a whole number instead of dividing it into major and minor
// More context about this can be found here
export const transformToPricePaidCents = ({
  costMajor,
  costMinor,
  pricePaidCents,
}: {
  costMajor: number | null | undefined
  costMinor: number | null | undefined
  pricePaidCents: number | null | undefined
}) => {
  if (costMajor) {
    return costMajor * 100 + (costMinor || 0)
  }
  return pricePaidCents
}
