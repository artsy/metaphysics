import { setVersion } from "./normalize"
import { GraphQLList, GraphQLString } from "graphql"

export const versionedImageUrl = (image, { version }) => setVersion(image, version)

export default {
  args: {
    version: {
      type: new GraphQLList(GraphQLString),
    },
  },
  type: GraphQLString,
  resolve: versionedImageUrl,
}
