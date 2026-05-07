import { GraphQLFieldConfigMap, GraphQLString, Thunk } from "graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "../artist"

// Map full category names from Gravity to shorter display names
const getCategoryDisplayName = (category: string | null): string | null => {
  if (!category) return null

  switch (category) {
    case "Drawing, Collage or other Work on Paper":
      return "Works on Paper"
    case "Fashion Design and Wearable Art":
      return "Fashion"
    case "Video/Film/Animation":
      return "Moving Image"
    case "Design/Decorative Art":
      return "Design"
    default:
      return category
  }
}

export const collectedArtistEdgeFields: Thunk<GraphQLFieldConfigMap<
  any,
  ResolverContext
>> = () => ({
  representativeCategory: {
    type: GraphQLString,
    description:
      "A representative medium/category for this artist based on the user's collection",
    resolve: ({ representative_category }) =>
      getCategoryDisplayName(representative_category),
  },
})

export const {
  connectionType: CollectedArtistsConnection,
  edgeType: CollectedArtistEdge,
} = connectionWithCursorInfo({
  name: "CollectedArtist",
  nodeType: ArtistType,
  edgeFields: collectedArtistEdgeFields,
  resolveNode: (node) => node.artist,
})
