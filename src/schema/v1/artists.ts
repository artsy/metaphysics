import Artist from "./artist"
import ArtistSorts from "./sorts/artist_sorts"
import {
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import config from "config"
import { ResolverContext } from "types/graphql"

const Artists: GraphQLFieldConfig<void, ResolverContext> = {
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
  resolve: (_root, options, { artistLoader, artistsLoader }) => {
    if (options.slugs) {
      return Promise.all(
        options.slugs.map((slug) =>
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
