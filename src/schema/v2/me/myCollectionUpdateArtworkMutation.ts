import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLLong } from "lib/customTypes/GraphQLLong"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { MyCollectionArtworkMutationType } from "./myCollection"
import {
  ArtworkAttributionClassEnum,
  computeImageSources,
  transformToPricePaidCents,
} from "./myCollectionCreateArtworkMutation"
import { EditableLocationFields } from "./update_me_mutation"
import {
  ArtworkSignatureTypeEnum,
  transformSignatureFieldsToGravityFields,
} from "../artwork/artworkSignatureTypes"
import { ArtworkConditionEnum } from "../artwork/artworkCondition"

interface MyCollectionArtworkUpdateMutationInput {
  additionalInformation?: string
  artworkId: string
  artistIds?: [string]
  attributionClass?: string
  category?: string
  coaByAuthenticatingBody?: boolean
  coaByGallery?: boolean
  condition?: string
  conditionDescription?: string
  confidentialNotes?: string
  costCurrencyCode?: string
  costMajor?: number
  costMinor?: number
  date?: string
  depth?: string
  hasCertificateOfAuthenticity?: boolean
  isEdition?: boolean
  isFramed?: boolean
  framedDepth?: string
  framedHeight?: string
  framedMetric?: string
  framedWidth?: string
  editionNumber?: string
  editionSize?: string
  externalImageUrls?: [string]
  artworkLocation?: string
  collectorLocation?: Record<string, string>
  pricePaidCents?: number
  pricePaidCurrency?: string
  signatureDetails?: string
  signatureTypes?: [string]
}

export const myCollectionUpdateArtworkMutation = mutationWithClientMutationId<
  MyCollectionArtworkUpdateMutationInput,
  any,
  ResolverContext
>({
  name: "MyCollectionUpdateArtwork",
  description: "Update an artwork in my collection",
  inputFields: {
    additionalInformation: {
      type: GraphQLString,
    },
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
    coaByAuthenticatingBody: {
      type: GraphQLBoolean,
    },
    coaByGallery: {
      type: GraphQLBoolean,
    },
    condition: {
      type: ArtworkConditionEnum,
    },
    conditionDescription: {
      type: GraphQLString,
    },
    confidentialNotes: {
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
    hasCertificateOfAuthenticity: {
      type: GraphQLBoolean,
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
      additionalInformation,
      artistIds,
      artworkId,
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
      updateArtworkLoader,
      createArtworkImageLoader,
      createArtworkEditionSetLoader,
      deleteArtworkEditionSetLoader,
      updateArtworkEditionSetLoader,
    }
  ) => {
    if (
      !artworkLoader ||
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
        additional_information: additionalInformation,
        artists: artistIds,
        coa_by_authenticating_body: coaByAuthenticatingBody,
        coa_by_gallery: coaByGallery,
        condition: condition,
        condition_description: conditionDescription,
        confidential_notes: confidentialNotes,
        cost_currency_code: costCurrencyCode,
        cost_minor: costMinor,
        artwork_location: artworkLocation,
        certificate_of_authenticity: hasCertificateOfAuthenticity,
        collector_location: collectorLocation,
        framed: isFramed,
        framed_depth: framedDepth,
        framed_height: framedHeight,
        framed_metric: framedMetric,
        framed_width: framedWidth,
        price_paid_cents: transformedPricePaidCents,
        price_paid_currency: pricePaidCurrency,
        attribution_class: attributionClass,
        signature: signatureDetails,
        ...transformSignatureFieldsToGravityFields(signatureTypes),
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

      // Loading the artwork again to get the updated version with the new images
      return await artworkLoader(artworkId)
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
