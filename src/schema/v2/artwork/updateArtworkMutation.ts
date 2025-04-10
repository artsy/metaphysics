import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import Artwork from "schema/v2/artwork"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

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

interface UpdateArtworkMutationInputProps {
  artistProofs?: string
  availability?: string
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
  offer?: boolean
  published?: boolean
  priceCurrency?: string
  priceHidden?: boolean
  priceIncludesTax?: boolean
  priceListed?: string
  priceMax?: number
  priceMin?: number
  shippingWeight?: number
  shippingWeightMetric?: string
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
}

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
  },
  outputFields: {
    artworkOrError: {
      type: ResponseOrErrorType,
      description: "On success: the artwork updated.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, editionSets, ...args },
    { updateArtworkLoader, updateArtworkEditionSetLoader }
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
        published: inputArgs.published,
        price_currency: inputArgs.priceCurrency,
        price_hidden: inputArgs.priceHidden,
        price_includes_tax: inputArgs.priceIncludesTax,
        price_listed: inputArgs.priceListed,
        price_max: inputArgs.priceMax,
        price_min: inputArgs.priceMin,
        shipping_weight_metric: inputArgs.shippingWeightMetric,
        shipping_weight: inputArgs.shippingWeight,
      }
    }

    try {
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
