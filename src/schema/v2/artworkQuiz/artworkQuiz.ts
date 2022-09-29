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

// fetch slugs first
// fetch artworks 3 at a time & cache
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
      marketable: true,
      sort: "-default_trending_score",
      for_sale: true,
      offerable: true,
      at_auction: false,
    }

    const quizGenes: string[] = [
      "trove",
      "artists-on-the-rise",
      "top-auction-lots",
      "finds-under-1000",
      "street-art-now-1",
      "trending-this-week",
      "iconic-prints",
    ]

    const geneArtworksResponse = quizGenes.map((slug) => {
      return filterArtworksLoader({
        ...defaultQuizFilters,
        gene_id: slug,
      }).then((response) => ({ gene: slug, hits: response.hits }))
    })

    const geneArtworksResults = await Promise.all(geneArtworksResponse)
    console.log("geneArtworksResponse", geneArtworksResults)

    const geneArtworks = geneArtworksResults.map((gene) => gene.hits)

    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    const collectionArtworks = []
    const artworks = [...geneArtworks, ...collectionArtworks]

    const count = artworks.length ?? 0

    return {
      totalCount: count,
      pageCursors: createPageCursors({ ...args, page, size }, artworks?.length),
      ...connectionFromArraySlice(artworks, args, {
        arrayLength: artworks.length,
        sliceStart: offset ?? 0,
      }),
    }
  },
}
