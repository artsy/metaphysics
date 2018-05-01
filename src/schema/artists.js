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
    slugs: {
      type: new GraphQLList(GraphQLString),
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
  resolve: (
    root,
    options,
    _request,
    { rootValue: { artistLoader, artistsLoader } }
  ) => {
    if (options.slugs) {
      return Promise.all(options.slugs.map(slug => artistLoader(slug)))
    }

    return artistsLoader(options)
  },
}

export default Artists
