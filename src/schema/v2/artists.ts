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
  resolve: (_root, args, { artistLoader, artistsLoader }) => {
    if (args.slugs) {
      return Promise.all(
        args.slugs.map((slug) =>
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

    return artistsLoader(args).then(({ body }) => body)
  },
}

export default Artists
