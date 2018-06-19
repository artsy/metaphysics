import config from "config"
import Gene from "./gene"
import { GraphQLList, GraphQLInt, GraphQLString } from "graphql"

const Genes = {
  type: new GraphQLList(Gene.type),
  description: "A list of Genes",
  args: {
    size: {
      type: GraphQLInt,
    },
    slugs: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return genes matching specified slugs.
        Accepts list of slugs.
      `,
    },
  },
  resolve: (
    root,
    options,
    request,
    { rootValue: { geneLoader, genesLoader } }
  ) => {
    if (options.slugs) {
      return Promise.all(
        options.slugs.map(slug =>
          geneLoader(
            slug,
            {},
            {
              requestThrottleMs: config.ARTICLE_REQUEST_THROTTLE_MS,
            }
          )
        )
      )
    }
    return genesLoader(options)
  },
}

export default Genes
