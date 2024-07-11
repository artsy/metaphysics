import { GraphQLFieldConfig, GraphQLList } from "graphql"
import { GraphQLNonNull, GraphQLObjectType } from "graphql"
import { InternalIDFields } from "schema/v2/object_identification"
import { quizArtworkConnection } from "./quizArtworkConnection"
import { ResolverContext } from "types/graphql"
import { date } from "schema/v2/fields/date"
import { ArtworkType } from "./artwork"
import fetch from "node-fetch"

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
        { savedArtworkLoader, artworksLoader, userID }
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

          /* Get artwork ids from a nearObject "user-as-query" weaviate search */

          const artworkIds = await fetch(
            `${process.env.FORCE_URL}/api/advisor/8/artworks/quiz_results?userId=${userID}`
          )
            .then((res) => res.json())
            .then((data) => {
              return data.map(({ internalID }) => internalID)
            })

          const result = await artworksLoader({ ids: artworkIds })

          return result
        } catch (error) {
          console.log("error", error)
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
