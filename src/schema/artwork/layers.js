import { remove } from "lodash"
import { enhance } from "lib/helpers"
import ArtworkLayer from "./layer"
import { GraphQLList } from "graphql"

export const artworkLayers = (id, loader) =>
  {return loader({ artwork: [id] })
    .then(layers => {return enhance(layers, { artwork_id: id })})
    .then(layers =>
      // Move fair layer to the beginning
      {return remove(layers, ({ type }) => {return type === "fair"}).concat(layers)}
    )}

export default {
  type: new GraphQLList(ArtworkLayer.type),
}
