import {
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { PageInfoType } from "graphql-relay"
import { ArtworkType } from "schema/v2/artwork"
import {
  connectionWithCursorInfo,
  PageCursorsType,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

const QuizArtworkType = new GraphQLObjectType<any, ResolverContext>({
  name: "QuizArtwork",
  fields: {
    artworkId: { type: GraphQLString },
    interactedWith: { type: GraphQLString },
    position: { type: GraphQLInt },
    artwork: { type: ArtworkType },
  },
})

const QuizArtworkEdgeInterface = new GraphQLInterfaceType({
  name: "QuizArtworkEdgeInterface",
  fields: {
    node: {
      type: QuizArtworkType,
    },
    cursor: {
      type: GraphQLString,
    },
  },
})

const QuizArtworkConnectionInterface = new GraphQLInterfaceType({
  name: "QuizArtworkConnectionInterface",
  fields: {
    pageCursors: { type: new GraphQLNonNull(PageCursorsType) },
    pageInfo: { type: new GraphQLNonNull(PageInfoType) },
    edges: { type: new GraphQLList(QuizArtworkEdgeInterface) },
  },
})

export const quizArtworkConnection = connectionWithCursorInfo({
  nodeType: QuizArtworkType,
  connectionInterfaces: [QuizArtworkConnectionInterface],
  edgeInterfaces: [QuizArtworkEdgeInterface],
})
