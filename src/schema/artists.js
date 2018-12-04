import Artist from "./artist"
import ArtistSorts from "./sorts/artist_sorts"
import { GraphQLList, GraphQLInt, GraphQLString } from "graphql"
import config from "config"

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
      description: `
        Only return artists matching specified slugs.
        Accepts list of slugs. (e.g. 'andy-warhol', 'banksy')
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
  resolve: (
    root,
    options,
    _request,
    { rootValue: { artistLoader, artistsLoader } }
  ) => {
    if (options.slugs) {
      return Promise.all(
        options.slugs.map(slug =>
          artistLoader(
            slug,
            {},
            {
              requestThrottleMs: config.ARTICLE_REQUEST_THROTTLE_MS,
            }
          )
        )
      )
    }

    return artistsLoader(options)
  },
}

export default Artists
