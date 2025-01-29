import { createGravityLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  FilterTypes,
  RenameTypes,
  RenameRootFields,
  FilterRootFields,
} from "graphql-tools"
import { readFileSync } from "fs"

const rootFieldsAllowList = ["agreement"]

export const executableGravitySchema = () => {
  const gravityTypeDefs = readFileSync("src/data/gravity.graphql", "utf8")

  const gravityLink = createGravityLink()
  const schema = makeRemoteExecutableSchema({
    schema: gravityTypeDefs,
    link: gravityLink,
  })

  // Types which come from Gravity which MP already has copies of.
  // In the future, these could get merged into the MP types.
  const duplicatedTypes = [
    "Artist",
    "ArtistConnection",
    "ArtistEdge",
    "Artwork",
    "ArtworkConnection",
    "ArtworkEdge",
    "Device",
    "Lot",
    "Money",
    "MoneyInput",
    "Sale",
    "SaleArtwork",
    "SaleArtworkConnection",
    "SaleArtworkEdge",
    "User",
    "UsersConnection",
    "UsersConnectionEdge",
    "ArtistSeries",
    "ArtistSeriesEdge",
    "ArtistSeriesConnection",
  ]

  // TODO: Get rid of these after cleanup on the Gravity side
  duplicatedTypes.push("ViewingRoom")
  duplicatedTypes.push("ViewingRoomsConnection")
  duplicatedTypes.push("ViewingRoomConnection")
  duplicatedTypes.push("ViewingRoomsEdge")
  duplicatedTypes.push("ViewingRoomsEdge")
  duplicatedTypes.push("ViewingRoomEdge")
  duplicatedTypes.push("ViewingRoomEdge")

  duplicatedTypes.push("CreateViewingRoomPayload")
  duplicatedTypes.push("CreateViewingRoomInput")
  duplicatedTypes.push("DeleteViewingRoomInput")
  duplicatedTypes.push("DeleteViewingRoomPayload")
  duplicatedTypes.push("ViewingRoomOrErrorsUnion")
  duplicatedTypes.push("ViewingRoomAttributes")
  duplicatedTypes.push("UpdateViewingRoomPayload")
  duplicatedTypes.push("UpdateViewingRoomInput")
  duplicatedTypes.push("UpdateViewingRoomArtworksPayload")
  duplicatedTypes.push("UpdateViewingRoomArtworksInput")
  duplicatedTypes.push("PublishViewingRoomInput")
  duplicatedTypes.push("PublishViewingRoomPayload")
  duplicatedTypes.push("UnpublishViewingRoomInput")
  duplicatedTypes.push("UnpublishViewingRoomPayload")
  duplicatedTypes.push("UpdateViewingRoomSubsectionsInput")
  duplicatedTypes.push("UpdateViewingRoomSubsectionsPayload")

  const excludedMutations: string[] = []

  // TODO: Get rid of these after cleanup on the Gravity side
  excludedMutations.push("createViewingRoom")
  excludedMutations.push("deleteViewingRoom")
  excludedMutations.push("publishViewingRoom")
  excludedMutations.push("unpublishViewingRoom")
  excludedMutations.push("updateViewingRoom")
  excludedMutations.push("updateViewingRoomArtworks")
  excludedMutations.push("updateViewingRoomSubsections")

  // Types which come from Gravity that are not (yet) needed in MP.
  // In the future, these can be removed from this list as they are needed.
  const unusedTypes = [
    "DebitCommissionExemptionInput",
    "DebitCommissionExemptionPayload",
    "LotEvent",
    "RefundCommissionExemptionInput",
    "RefundCommissionExemptionPayload",
  ]

  // Return the new modified schema
  return transformSchema(schema, [
    // Remove types which Metaphysics handles better
    new FilterTypes((type) => {
      return (
        !duplicatedTypes.includes(type.name) && !unusedTypes.includes(type.name)
      )
    }),
    // So, we cannot remove all of the types from a schema is a lesson I have
    // learned in creating these transformations. This means that there has to
    // be at least one type still inside the Schema (excluding the Mutation or
    // the Query)
    // When Partner was removed, we'd see this error
    // https://github.com/graphcool/graphql-import/issues/73
    // but I don't think we're exhibiting the same bug.
    new RenameTypes((name) => {
      if (name === "Partner") {
        return "DoNotUseThisPartner"
      }
      return name
    }),
    // We have the same restrictions for root, so let's prefix
    // for now
    new RenameRootFields((type, name, _field) => {
      if (type === "Query" && !rootFieldsAllowList.includes(name)) {
        return `_unused_gravity_${name}`
      } else {
        return name
      }
    }),
    new FilterRootFields((operation, name) => {
      if (!name) return true

      if (operation === "Mutation") {
        return !excludedMutations.includes(name)
      }

      return true
    }),
  ])
}
