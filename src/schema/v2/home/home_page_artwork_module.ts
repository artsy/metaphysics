import { chain, find } from "lodash"
import { params as genericGenes } from "./add_generic_genes"
import Results from "./results"
import Title from "./title"
import Context from "./context"
import Params from "./params"
import { NodeInterface } from "schema/v2/object_identification"
import { toGlobalId } from "graphql-relay"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { HomePageArtworkModuleTypes } from "./types"

let possibleArgs

export const HomePageArtworkModuleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageArtworkModule",
  interfaces: [NodeInterface],
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "A globally unique ID.",
      resolve: ({ key, params }) => {
        // Compose this ID from params that `resolve` uses to identify a rail later on.
        const payload = chain(params).pick(possibleArgs).set("key", key).value()
        return toGlobalId("HomePageArtworkModule", JSON.stringify(payload))
      },
    },
    context: Context,
    isDisplayable: {
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

const HomePageArtworkModule: GraphQLFieldConfig<void, ResolverContext> = {
  type: HomePageArtworkModuleType,
  description: "Single artwork module to show on the home screen",
  args: {
    followedArtistID: {
      type: GraphQLString,
      description: "ID of followed artist to target for related artist rails",
    },
    id: {
      type: GraphQLString,
      description: "ID of generic gene rail to target",
    },
    key: {
      type: HomePageArtworkModuleTypes,
      description: "Module key",
    },
    relatedArtistID: {
      type: GraphQLString,
      description: "ID of related artist to target for related artist rails",
    },
  },
  resolve: (
    _root,
    {
      key,
      id,
      followedArtistID: followed_artist_id,
      relatedArtistID: related_artist_id,
    },
    { geneLoader }
  ) => {
    // TODO Really not entirely sure what this `display` param is about.
    const display = true
    switch (key) {
      case "generic_gene":
        return { key, display, params: find(genericGenes, ["id", id]) }
      // Emission may include an `id` param here,
      // but Force does not.
      case "genes":
        if (id) {
          return geneLoader(id).then((gene) => {
            return { key, display, params: { id, gene } }
          })
        }

        return { key, display, params: {} }
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

possibleArgs = Object.keys(HomePageArtworkModule.args!).sort()

export default HomePageArtworkModule
