import { GraphQLUnionType } from "graphql"
import { ArtworkType } from "./artwork"
import { EditionSetType } from "./edition_set"

export const ArtworkOrEditionSetType = new GraphQLUnionType({
  name: "ArtworkOrEditionSetType",
  types: [ArtworkType, EditionSetType],
})
