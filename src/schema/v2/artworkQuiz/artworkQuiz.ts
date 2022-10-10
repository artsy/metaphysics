import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import {
  ArtworkConnectionInterface,
  ArtworkEdgeInterface,
  ArtworkType,
} from "schema/v2/artwork"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

const artQuizConnectionDefinition = connectionWithCursorInfo({
  name: "QuizArtworks",
  nodeType: ArtworkType,
  edgeInterfaces: [ArtworkEdgeInterface],
  connectionInterfaces: [ArtworkConnectionInterface],
})

const QUIZ_GENES: string[] = [
  "trove",
  "artists-on-the-rise",
  "top-auction-lots",
  "finds-under-1000",
  "street-art-now-1",
  "trending-this-week",
  "iconic-prints",
]

const COLLECTION_ID = "contemporary-now"

export const artQuizConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: artQuizConnectionDefinition.connectionType,
  args: pageable({
    page: { type: GraphQLInt },
  }),
  resolve: async (
    _root: void,
    args: CursorPageable,
    context: ResolverContext
  ) => {
    const { filterArtworksLoader } = context

    const defaultQuizFilters: Record<string, any> = {
      at_auction: false,
      for_sale: true,
      size: 4,
      marketable: true,
      offerable: true,
      sort: "-default_trending_score",
    }

    const results = [
      ...QUIZ_GENES.map(async (slug) =>
        filterArtworksLoader({
          ...defaultQuizFilters,
          gene_id: slug,
        }).then((response) =>
          response.hits.map((artwork) => ({
            ...artwork,
            quiz_filter_criteria: slug,
          }))
        )
      ),
      filterArtworksLoader({
        ...defaultQuizFilters,
        marketing_collection_id: COLLECTION_ID,
      }).then((response) =>
        response.hits.map((artwork) => ({
          ...artwork,
          quiz_filter_criteria: COLLECTION_ID,
        }))
      ),
    ]

    const quizArtworksHits = await Promise.all(results)
    const quizArtworks = quizArtworksHits.flatMap((artworks) =>
      artworks.slice(0, 2)
    )
    const remainingArtworks = quizArtworksHits.flat()

    const uniqueArtworkIds = new Set()
    const uniqueArtworks: any[] = []

    quizArtworks.forEach((artwork) => {
      if (uniqueArtworkIds.has(artwork.id)) {
        const replacement = remainingArtworks.find(
          (hit) =>
            hit.art_quiz_critera === artwork.art_quiz_critera &&
            hit.id !== artwork.id &&
            !uniqueArtworkIds.has(hit.id)
        )
        uniqueArtworkIds.add(replacement.id)
        uniqueArtworks.push(replacement)
      } else {
        uniqueArtworkIds.add(artwork.id)
        uniqueArtworks.push(artwork)
      }
    })

    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    const count = uniqueArtworks.length ?? 0

    return {
      totalCount: count,
      pageCursors: createPageCursors(
        { ...args, page, size },
        uniqueArtworks?.length
      ),
      ...connectionFromArraySlice(uniqueArtworks, args, {
        arrayLength: uniqueArtworks.length,
        sliceStart: offset ?? 0,
      }),
    }
  },
}
