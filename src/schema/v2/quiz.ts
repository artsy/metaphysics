import { GraphQLFieldConfig, GraphQLList } from "graphql"
import { GraphQLNonNull, GraphQLObjectType } from "graphql"
import { InternalIDFields } from "schema/v2/object_identification"
import { quizArtworkConnection } from "./quizArtworkConnection"
import { ResolverContext } from "types/graphql"
import { date } from "schema/v2/fields/date"
import { ArtworkType } from "./artwork"
import { flatten, take } from "lodash"

export const QuizType = new GraphQLObjectType<any, ResolverContext>({
  name: "Quiz",
  fields: () => ({
    ...InternalIDFields,
    quizArtworkConnection,
    completedAt: date(
      ({ completed_at }: { completed_at: string | null }) => completed_at
    ),
    savedArtworks: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArtworkType))
      ),
      resolve: async ({ quiz_artworks }, _, { savedArtworkLoader }) => {
        if (!savedArtworkLoader) return []

        try {
          const artworks = await Promise.all(
            quiz_artworks.map(({ artwork_id }) => {
              return savedArtworkLoader(artwork_id)
            })
          )

          return artworks.filter(({ is_saved }) => is_saved)
        } catch (error) {
          return []
        }
      },
    },
    recommendedArtworks: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArtworkType))
      ),
      resolve: async (
        { quiz_artworks },
        _,
        { savedArtworkLoader, relatedLayerArtworksLoader }
      ) => {
        if (!savedArtworkLoader) return []

        try {
          const artworks = await Promise.all(
            quiz_artworks.map(({ artwork_id }) => {
              return savedArtworkLoader(artwork_id)
            })
          )

          const savedArtworks = artworks.filter(({ is_saved }) => is_saved)

          if (savedArtworks.length === 0) return []

          const recommendedArtworks = await Promise.all(
            savedArtworks.map(({ id }) => {
              return relatedLayerArtworksLoader(
                { id: "main", type: "synthetic" },
                { artwork: [id] },
                { requestThrottleMs: 86400000 }
              )
            })
          )

          // Rather than pass a `size` to the `relatedLayerArtworksLoader`
          // we filter results after the fact rather than split the cache across
          // different sizes.
          const filtered = recommendedArtworks
            .filter((artworks) => artworks.length > 0)
            .map((artworks) => {
              if (savedArtworks.length === 1) return artworks
              if (savedArtworks.length <= 3) return take(artworks, 8)
              return take(artworks, 4)
            })

          return flatten(filtered)
        } catch (error) {
          return []
        }
      },
    },
  }),
})

export const quiz: GraphQLFieldConfig<any, ResolverContext> = {
  description: "The art quiz of a logged-in user",
  type: new GraphQLNonNull(QuizType),
  resolve: async ({ id }, _args, { quizLoader }) => {
    if (!quizLoader) return
    const quiz = await quizLoader(id)
    return quiz
  },
}
