import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFloat,
} from "graphql"
import { InternalIDFields, NodeInterface } from "../object_identification"
import { ResolverContext } from "types/graphql"
import { date } from "../fields/date"
import { ArtworkType } from "../artwork"
import GraphQLJSON from "graphql-type-json"
import { connectionWithCursorInfo } from "../fields/pagination"

export const ArtworkDuplicatePairType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkDuplicatePair",
  interfaces: [NodeInterface],
  fields: () => ({
    ...InternalIDFields,
    status: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Status of the duplicate pair (open, dismissed, merged)",
    },
    similarityScore: {
      type: GraphQLFloat,
      description: "Similarity score between the artworks",
      resolve: ({ similarity_score }) => similarity_score,
    },
    artworkOne: {
      type: new GraphQLNonNull(ArtworkType),
      description: "Primary artwork in the duplicate pair",
      resolve: ({ artwork_one }) => artwork_one,
    },
    artworkTwo: {
      type: new GraphQLNonNull(ArtworkType),
      description: "Secondary artwork in the duplicate pair",
      resolve: ({ artwork_two }) => artwork_two,
    },
    matchMetadata: {
      type: GraphQLJSON,
      description: "Additional metadata about the match",
      resolve: ({ match_metadata }) => match_metadata,
    },
    createdAt: date(({ created_at }) => created_at),
    updatedAt: date(({ updated_at }) => updated_at),
  }),
})

export const {
  connectionType: ArtworkDuplicatePairsConnectionType,
  edgeType: ArtworkDuplicatePairEdgeType,
} = connectionWithCursorInfo({
  name: "ArtworkDuplicatePair",
  nodeType: ArtworkDuplicatePairType,
})
