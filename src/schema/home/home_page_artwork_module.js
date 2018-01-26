import { chain, find } from "lodash"
import { params as genericGenes } from "./add_generic_genes"
import Results from "./results"
import Title from "./title"
import Context from "./context"
import Params from "./params"
import { NodeInterface } from "schema/object_identification"
import { toGlobalId } from "graphql-relay"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
} from "graphql"

let possibleArgs

export const HomePageArtworkModuleType = new GraphQLObjectType({
  name: "HomePageArtworkModule",
  interfaces: [NodeInterface],
  fields: () => ({
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "A globally unique ID.",
      resolve: ({ key, params }) => {
        // Compose this ID from params that `resolve` uses to identify a rail later on.
        const payload = chain(params)
          .pick(possibleArgs)
          .set("key", key)
          .value()
        return toGlobalId("HomePageArtworkModule", JSON.stringify(payload))
      },
    },
    context: Context,
    display: {
      type: GraphQLString,
      deprecationReason:
        "Favor `is_`-prefixed Booleans (*and* this should be a Boolean)",
    },
    is_displayable: {
      type: GraphQLBoolean,
      resolve: ({ display }) => display,
    },
    key: {
      type: GraphQLString,
    },
    params: Params,
    results: Results,
    title: Title,
  }),
})

const HomePageArtworkModule = {
  type: HomePageArtworkModuleType,
  description: "Single artwork module to show on the home screen",
  args: {
    followed_artist_id: {
      type: GraphQLString,
      description: "ID of followed artist to target for related artist rails",
    },
    generic_gene_id: {
      type: GraphQLString,
      description: "ID of generic gene rail to target",
      deprecationReason: "Favor more specific `generic_gene_id`",
    },
    id: {
      type: GraphQLString,
      description: "ID of generic gene rail to target",
    },
    key: {
      type: GraphQLString,
      description: "Module key",
    },
    related_artist_id: {
      type: GraphQLString,
      description: "ID of related artist to target for related artist rails",
    },
  },
  resolve: (
    root,
    { key, id, followed_artist_id, related_artist_id },
    request,
    { rootValue: { geneLoader } }
  ) => {
    // TODO Really not entirely sure what this `display` param is about.
    const display = true
    switch (key) {
      case "generic_gene":
        return { key, display, params: find(genericGenes, ["id", id]) }
      case "genes":
        return geneLoader(id).then(gene => {
          return { key, display, params: { id, gene } }
        })
      case "followed_artist":
        return { key, display, params: { followed_artist_id } }
      case "related_artists":
        return {
          key,
          display,
          params: { followed_artist_id, related_artist_id },
        }
      default:
        return { key, display, params: {} }
    }
  },
}

possibleArgs = Object.keys(HomePageArtworkModule.args).sort()

export default HomePageArtworkModule
