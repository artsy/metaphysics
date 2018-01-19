import Artist from "./artist"
import ArtistSorts from "./sorts/artist_sorts"
import { GraphQLList, GraphQLInt } from "graphql"

const Artists = {
  type: new GraphQLList(Artist.type),
  description: "A list of Artists",
  args: {
    page: {
      type: GraphQLInt,
      defaultValue: 1,
    },
    size: {
      type: GraphQLInt,
    },
    sort: ArtistSorts,
  },
  resolve: (root, options, _request, { rootValue: { artistsLoader } }) =>
    artistsLoader(options),
}

export default Artists
