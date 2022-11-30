import { GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import Artwork from "schema/v2/artwork"
import { omitBy } from "lodash"

interface UpdateArtworkMutationInputProps {
  id: string
  availability?: boolean
}

export const updateArtworkMutation = mutationWithClientMutationId<
  UpdateArtworkMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdateArtworkMutation",
  description: "Updates an artwork.",
  inputFields: {
    availability: {
      type: GraphQLString,
      description: "The availability of the artwork",
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the artwork to update.",
    },
  },
  outputFields: {
    artwork: {
      type: Artwork.type,
      resolve: (artwork) => artwork,
    },
  },
  mutateAndGetPayload: async ({ id, ...props }, { updateArtworkLoader }) => {
    if (!updateArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const payload = omitBy(props, (prop) => prop == null)

    try {
      const response = await updateArtworkLoader(id, payload)
      return response
    } catch (error) {
      throw new Error(error.body.error)
    }
  },
})
