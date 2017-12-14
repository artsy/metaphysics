import { remove } from "lodash"
import gravity from "lib/loaders/legacy/gravity"
import { enhance } from "lib/helpers"
import ArtworkLayer from "./layer"
import { GraphQLList } from "graphql"

export const artworkLayers = id =>
  gravity(`related/layers`, { artwork: [id] })
    .then(layers => enhance(layers, { artwork_id: id }))
    .then(layers =>
      // Move fair layer to the beginning
      remove(layers, ({ type }) => type === "fair").concat(layers)
    )

export default {
  type: new GraphQLList(ArtworkLayer.type),
}
