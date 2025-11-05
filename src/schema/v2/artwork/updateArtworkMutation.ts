import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
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
import Artwork from "schema/v2/artwork"
import { ResolverContext } from "types/graphql"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "updateArtworkSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    artwork: {
      type: Artwork.type,
      resolve: (artwork) => artwork,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "updateArtworkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "updateArtworkResponseOrError",
  types: [SuccessType, FailureType],
})

interface S3LocationInput {
  bucket: string
  key: string
}

interface UpdateArtworkMutationInputProps {
  artistProofs?: string
  availability?: string
  defaultImageID?: string
  delete?: boolean
  displayPriceRange?: boolean
  ecommerce?: boolean
  editionSets?: Omit<UpdateArtworkMutationInputProps, "editionSets">[]
  editionSize?: string
  framed?: boolean
  framedDepth?: string
  framedDiameter?: string
  framedHeight?: string
  framedMetric?: string
  framedWidth?: string
  id?: string
  imageS3Locations?: S3LocationInput[]
  offer?: boolean
  partnerLocationId?: string
  published?: boolean
  priceCurrency?: string
  priceHidden?: boolean
  priceIncludesTax?: boolean
  priceListed?: string
  priceMax?: number
  priceMin?: number
  shippingWeight?: number
  shippingWeightMetric?: string
  title?: string
}

const inputFields = {
  id: {
    type: new GraphQLNonNull(GraphQLString),
    description: "The id of the artwork to update.",
  },
  availability: {
    type: GraphQLString,
    description: "The availability of the artwork",
  },
  defaultImageID: {
    type: GraphQLString,
    description: "The ID of the image to set as the default for this artwork",
  },
  displayPriceRange: {
    type: GraphQLBoolean,
    description: "Show/Hide the price range of an artwork",
  },
  offer: {
    type: GraphQLBoolean,
    description: "True for `Make Offer` artworks",
  },
  priceHidden: {
    type: GraphQLBoolean,
    description: "Show/Hide the price of an artwork",
  },
  priceListed: {
    type: GraphQLString,
    description: "The price of the artwork",
  },
  artistProofs: {
    type: GraphQLString,
  },
  delete: {
    type: GraphQLBoolean,
  },
  ecommerce: {
    description: "True for `Buy Now` edition sets",
    type: GraphQLBoolean,
  },
  editionSize: {
    type: GraphQLString,
  },
  framedDepth: {
    type: GraphQLString,
  },
  framedDiameter: {
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
  framed: {
    type: GraphQLBoolean,
  },
  partnerLocationId: {
    type: GraphQLString,
  },
  published: {
    type: GraphQLBoolean,
  },
  priceCurrency: {
    type: GraphQLString,
  },
  priceIncludesTax: {
    type: GraphQLBoolean,
  },
  priceMax: {
    type: GraphQLInt,
  },
  priceMin: {
    type: GraphQLInt,
  },
  shippingWeightMetric: {
    type: GraphQLString,
  },
  shippingWeight: {
    type: GraphQLFloat,
  },
  title: {
    type: GraphQLString,
  },
}

// TODO: Extract this and use it in other mutations that require S3 locations
const S3LocationInputType = new GraphQLInputObjectType({
  name: "S3LocationInput",
  fields: {
    bucket: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The S3 bucket name where the image is stored.",
    },
    key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The S3 key (object path) for the image.",
    },
  },
})

const UpdateArtworkEditionSetInput = new GraphQLInputObjectType({
  name: "UpdateArtworkEditionSetInput",
  fields: inputFields,
})

export const updateArtworkMutation = mutationWithClientMutationId<
  UpdateArtworkMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdateArtworkMutation",
  description: "Updates an artwork.",
  inputFields: {
    ...inputFields,
    editionSets: {
      type: new GraphQLList(UpdateArtworkEditionSetInput),
      description: "A list of edition sets for the artwork",
    },
    imageS3Locations: {
      type: new GraphQLList(new GraphQLNonNull(S3LocationInputType)),
      description:
        "A list of S3 locations (bucket and key pairs) for artwork images to be added.",
    },
  },
  outputFields: {
    artworkOrError: {
      type: ResponseOrErrorType,
      description: "On success: the artwork updated.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, editionSets, imageS3Locations, defaultImageID, ...args },
    {
      updateArtworkLoader,
      updateArtworkEditionSetLoader,
      addImageToArtworkLoader,
      setDefaultArtworkImageLoader,
    }
  ) => {
    if (!updateArtworkLoader || !updateArtworkEditionSetLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const getGravityArgs = (inputArgs: UpdateArtworkMutationInputProps) => {
      return {
        artist_proofs: inputArgs.artistProofs,
        availability: inputArgs.availability,
        delete: inputArgs.delete,
        display_price_range: inputArgs.displayPriceRange,
        ecommerce: inputArgs.ecommerce,
        edition_size: inputArgs.editionSize,
        framed_depth: inputArgs.framedDepth,
        framed_diameter: inputArgs.framedDiameter,
        framed_height: inputArgs.framedHeight,
        framed_metric: inputArgs.framedMetric,
        framed_width: inputArgs.framedWidth,
        framed: inputArgs.framed,
        id: inputArgs.id,
        offer: inputArgs.offer,
        partner_location_id: inputArgs.partnerLocationId,
        published: inputArgs.published,
        price_currency: inputArgs.priceCurrency,
        price_hidden: inputArgs.priceHidden,
        price_includes_tax: inputArgs.priceIncludesTax,
        price_listed: inputArgs.priceListed,
        price_max: inputArgs.priceMax,
        price_min: inputArgs.priceMin,
        shipping_weight_metric: inputArgs.shippingWeightMetric,
        shipping_weight: inputArgs.shippingWeight,
        title: inputArgs.title,
      }
    }

    try {
      // Handle image additions if provided
      if (imageS3Locations?.length) {
        if (!addImageToArtworkLoader) {
          return new Error("You need to be signed in to perform this action")
        }

        // Attach all images sequentially to avoid race conditions
        for (const location of imageS3Locations) {
          await addImageToArtworkLoader(id, {
            source_bucket: location.bucket,
            source_key: location.key,
          })
        }
      }

      // Set default image if provided
      if (defaultImageID && setDefaultArtworkImageLoader) {
        await setDefaultArtworkImageLoader({
          artworkId: id,
          imageId: defaultImageID,
        })
      }

      if (editionSets?.length > 0) {
        await Promise.all(
          editionSets.map((editionSet) => {
            const input = getGravityArgs(editionSet)

            return updateArtworkEditionSetLoader(
              {
                artworkId: id,
                editionSetId: editionSet.id,
              },
              input
            )
          })
        )
      }

      const response = await updateArtworkLoader(id, getGravityArgs(args))

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
