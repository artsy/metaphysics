import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLBoolean,
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
  id?: string
  availability?: boolean
  ecommerce?: boolean
  displayPriceRange?: boolean
  offer?: boolean
  priceHidden?: boolean
  priceListed?: string
  editionSets?: Omit<UpdateArtworkMutationInputProps, "editionSets">[]
}

const inputFields = {
  availability: {
    type: GraphQLString,
    description: "The availability of the artwork",
  },
  ecommerce: {
    type: GraphQLBoolean,
    description: "True for `Buy Now` artworks",
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
  id: {
    type: new GraphQLNonNull(GraphQLString),
    description: "The id of the artwork to update.",
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
        id: inputArgs.id,
        availability: inputArgs.availability,
        ecommerce: inputArgs.ecommerce,
        display_price_range: inputArgs.displayPriceRange,
        offer: inputArgs.offer,
        price_hidden: inputArgs.priceHidden,
        price_listed: inputArgs.priceListed,
      }
    }

    try {
      if (editionSets?.length) {
        await Promise.all(
          editionSets.map((editionSet) => {
            return updateArtworkEditionSetLoader({
              ...getGravityArgs(editionSet),
              artworkId: id,
              editionSetId: editionSet.id,
            })
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
