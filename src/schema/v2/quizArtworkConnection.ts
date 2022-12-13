import {
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ArtworkType } from "schema/v2/artwork"
import { date } from "schema/v2/fields/date"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

export const QuizArtworkConnectionType = connectionWithCursorInfo({
  name: "QuizArtwork",
  edgeFields: {
    test: {
      type: GraphQLString,
      resolve: () => "test",
    },
    interactedAt: date(
      ({ interacted_at }: { interacted_at: string | null }) => interacted_at
    ),
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ position }) => position,
    },
  },
  nodeType: ArtworkType,
}).connectionType

export const quizArtworkConnection: GraphQLFieldConfig<any, ResolverContext> = {
  type: QuizArtworkConnectionType,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  resolve: ({ quiz_artworks }, args) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs({
      first: args?.first || 16,
      ...args,
    })
    const totalCount = quiz_artworks.length

    const quizArtworks = paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body: quiz_artworks,
      args,
      resolveNode: (node) => {
        return node.artwork
      },
    })

    return quizArtworks
  },
}
