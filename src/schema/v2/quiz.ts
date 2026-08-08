import { GraphQLFieldConfig, GraphQLList } from "graphql"
import { GraphQLNonNull, GraphQLObjectType } from "graphql"
import { InternalIDFields } from "schema/v2/object_identification"
import { quizArtworkConnection } from "./quizArtworkConnection"
import { ResolverContext } from "types/graphql"
import { date } from "schema/v2/fields/date"
import { ArtworkType } from "./artwork"
import { compact, flatten, take } from "lodash"

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

          // A saved-artwork record can outlive the artwork it points to (e.g.
          // the artwork was later deleted or unlisted). Gravity then hands
          // back a partial record with `is_saved: true` but no `id` (the
          // slug), which would crash the non-null `Artwork.slug` field.
          // Drop those incomplete nodes rather than crash the whole list.
          return artworks.filter(({ is_saved, id }) => is_saved && id)
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

          // See the comment in `savedArtworks` above: a saved-artwork record
          // can point at an artwork that no longer exists, in which case
          // Gravity returns a partial record with no `id` (slug).
          const savedArtworks = artworks.filter(
            ({ is_saved, id }) => is_saved && id
          )

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
              // Related-artwork results can likewise include a stale entry
              // for an artwork that's since been deleted/unlisted and is
              // missing its `id` (slug). Drop those before slicing/nulling
              // the non-null `Artwork.slug` field for the whole list.
              const completeArtworks = compact(artworks).filter(
                (artwork: any) => artwork.id
              )

              if (savedArtworks.length === 1) return completeArtworks
              if (savedArtworks.length <= 3) return take(completeArtworks, 8)
              return take(completeArtworks, 4)
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
