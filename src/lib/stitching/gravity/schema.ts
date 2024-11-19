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
import config from "config"

const rootFieldsAllowList = [
  "agreement",
  "viewingRoom",
  "viewingRooms",
  "viewingRoomsConnection",
]

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

  if (config.USE_UNSTITCHED_SECOND_FACTORS_SCHEMA) {
    duplicatedTypes.push("SecondFactor")
    duplicatedTypes.push("AppSecondFactor")
    duplicatedTypes.push("BackupSecondFactor")
    duplicatedTypes.push("BackupSecondFactors")
    duplicatedTypes.push("SmsSecondFactor")
    duplicatedTypes.push("SecondFactorKind")
    duplicatedTypes.push("SmsSecondFactorAttributes")
    duplicatedTypes.push("SmsSecondFactorOrErrorsUnion")
    duplicatedTypes.push("CreateSmsSecondFactorInput")
    duplicatedTypes.push("CreateSmsSecondFactorPayload")
    duplicatedTypes.push("UpdateSmsSecondFactorInput")
    duplicatedTypes.push("UpdateSmsSecondFactorPayload")
    duplicatedTypes.push("AppSecondFactorAttributes")
    duplicatedTypes.push("AppSecondFactorOrErrorsUnion")
    duplicatedTypes.push("CreateAppSecondFactorInput")
    duplicatedTypes.push("CreateAppSecondFactorPayload")
    duplicatedTypes.push("UpdateAppSecondFactorInput")
    duplicatedTypes.push("UpdateAppSecondFactorPayload")
    duplicatedTypes.push("BackupSecondFactorsOrErrorsUnion")
    duplicatedTypes.push("CreateBackupSecondFactorsInput")
    duplicatedTypes.push("CreateBackupSecondFactorsPayload")
    duplicatedTypes.push("SecondFactorOrErrorsUnion")
    duplicatedTypes.push("DisableSecondFactorInput")
    duplicatedTypes.push("DisableSecondFactorPayload")
    duplicatedTypes.push("DeliverSecondFactorInput")
    duplicatedTypes.push("DeliverSecondFactorPayload")
    duplicatedTypes.push("EnableSecondFactorInput")
    duplicatedTypes.push("EnableSecondFactorPayload")
  }

  const excludedMutations: string[] = []
  if (config.USE_UNSTITCHED_SECOND_FACTORS_SCHEMA) {
    excludedMutations.push("createSmsSecondFactor")
    excludedMutations.push("updateSmsSecondFactor")
    excludedMutations.push("createAppSecondFactor")
    excludedMutations.push("updateAppSecondFactor")
    excludedMutations.push("createBackupSecondFactors")
    excludedMutations.push("disableSecondFactor")
    excludedMutations.push("deliverSecondFactor")
    excludedMutations.push("enableSecondFactor")
  }

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
