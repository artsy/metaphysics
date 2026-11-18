import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { majorToMinor } from "lib/moneyHelpers"
import { ArtworkConditionEnum } from "schema/v2/artwork/artworkCondition"
import { ResolverContext } from "types/graphql"
import {
  ResaleSubmissionCourierHandoffEnum,
  ResaleSubmissionPackagingEnum,
  ResaleSubmissionPackerEnum,
  ResaleSubmissionType,
} from "./resaleSubmission"

// Matches Gravity's limit of 10 condition photos per submission
const MAX_IMAGE_URLS = 10

interface Input {
  condition?: string | null
  conditionDescription?: string | null
  courierHandoff?: string | null
  externalImageUrls?: string[] | null
  id: string
  notes?: string | null
  packaging?: string | null
  packer?: string | null
  priceListed?: string | null
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateResaleSubmissionSuccess",
  fields: () => ({
    resaleSubmission: {
      type: ResaleSubmissionType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateResaleSubmissionFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateResaleSubmissionResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "UpdateResaleSubmissionFailure"
    }
    return "UpdateResaleSubmissionSuccess"
  },
})

export const updateResaleSubmissionMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "UpdateResaleSubmission",
  description:
    "Update the condition, asking price, shipping preferences, condition photos and notes of a resale submission. Omitted or null fields are left unchanged.",
  inputFields: {
    condition: {
      type: ArtworkConditionEnum,
      description: "The work’s condition.",
    },
    conditionDescription: {
      type: GraphQLString,
      description:
        "Notes on changes or flaws in the work. An empty string clears them.",
    },
    courierHandoff: {
      type: ResaleSubmissionCourierHandoffEnum,
      description: "How the work will get to its buyer.",
    },
    externalImageUrls: {
      type: new GraphQLList(GraphQLString),
      description: `S3 URLs of uploaded photos to add as condition photos, in order, at most ${MAX_IMAGE_URLS}. Each is added separately: if one fails, the ones before it stay saved, so reload conditionPhotos before retrying.`,
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the resale submission to update.",
    },
    notes: {
      type: GraphQLString,
      description:
        "Free-text notes about the work. Send an empty string to clear them.",
    },
    packaging: {
      type: ResaleSubmissionPackagingEnum,
      description: "How the work will be packed.",
    },
    packer: {
      type: ResaleSubmissionPackerEnum,
      description: "Who will pack the work.",
    },
    priceListed: {
      type: GraphQLString,
      description:
        "The asking price in US dollars, as a plain number like “2500” or “2500.50”, without a currency symbol or separators.",
    },
  },
  outputFields: {
    resaleSubmissionOrError: {
      type: ResponseOrErrorType,
      description: "On success: the updated resale submission.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      condition,
      conditionDescription,
      courierHandoff,
      externalImageUrls,
      id,
      notes,
      packaging,
      packer,
      priceListed,
    },
    {
      meCreateResaleSubmissionImageLoader,
      meResaleSubmissionLoader,
      meUpdateResaleSubmissionLoader,
    }
  ) => {
    if (
      !meCreateResaleSubmissionImageLoader ||
      !meResaleSubmissionLoader ||
      !meUpdateResaleSubmissionLoader
    ) {
      throw new Error("You need to be signed in to perform this action")
    }

    const gravityParams: Record<string, string | number> = {}

    if (priceListed != null) {
      // Resale is US-only for now, so every price is USD.
      const price = majorToMinor(priceListed, "USD")

      if (!price.success) {
        throw new Error(price.error)
      }

      gravityParams.price_listed_minor = price.minor
    }

    if (packaging != null) gravityParams.packaging = packaging
    if (packer != null) gravityParams.packer = packer
    if (courierHandoff != null) gravityParams.courier_handoff = courierHandoff
    if (notes != null) gravityParams.notes = notes
    if (condition != null) gravityParams.condition = condition
    if (conditionDescription != null) {
      gravityParams.condition_description = conditionDescription
    }

    const imageUrls = (externalImageUrls ?? []).filter(
      (url): url is string => !!url
    )

    if (imageUrls.length > MAX_IMAGE_URLS) {
      throw new Error(
        `A submission can have at most ${MAX_IMAGE_URLS} condition photos`
      )
    }

    try {
      if (imageUrls.length === 0) {
        return await meUpdateResaleSubmissionLoader(id, gravityParams)
      }

      if (Object.keys(gravityParams).length > 0) {
        await meUpdateResaleSubmissionLoader(id, gravityParams)
      }

      for (const imageUrl of imageUrls) {
        await meCreateResaleSubmissionImageLoader(id, { image_url: imageUrl })
      }

      return await meResaleSubmissionLoader(id)
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
