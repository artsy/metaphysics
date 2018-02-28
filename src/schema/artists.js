import Artist from "./artist"
import ArtistSorts from "./sorts/artist_sorts"
import { GraphQLList, GraphQLInt, GraphQLString } from "graphql"

const Artists = {
  type: new GraphQLList(Artist.type),
  description: "A list of Artists",
  args: {
    ids: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return artists matching specified ids.
        Accepts list of ids.
      `,
    },
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
