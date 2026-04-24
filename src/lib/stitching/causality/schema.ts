import { createCausalityLink } from "./link"
import { buildSchema } from "graphql"
import {
  wrapSchema,
  RenameTypes,
  RenameRootFields,
  FilterRootFields,
  FilterTypes,
} from "@graphql-tools/wrap"
import type { SubschemaConfig } from "@graphql-tools/delegate"
import { linkToExecutor } from "lib/stitching/lib/linkToExecutor"
import { readFileSync } from "fs"

const allowlistedTypes: string[] = []
const whitelistedRootFields: string[] = []
const privateFields: string[] = ["lot", "lotStandingConnection"]
const permittedRootFields = [...whitelistedRootFields, ...privateFields]

export const causalitySubschemaConfig = (): SubschemaConfig => {
  const causalityLink = createCausalityLink()
  const causalityTypeDefs = readFileSync("src/data/causality.graphql", "utf8")

  return {
    schema: buildSchema(causalityTypeDefs, { assumeValidSDL: true }),
    executor: linkToExecutor(causalityLink),
    transforms: [
      new FilterTypes((type) => !allowlistedTypes.includes(type.name)),
      new FilterRootFields((_operation, name, _field) => {
        if (!name) {
          return false
        }

        return permittedRootFields.includes(name)
      }),
      new RenameTypes((name) => {
        if (name === "Long") return "Long"
        if (name === "Lot") name = "LotState"
        if (name === "Sale") name = "SaleState"
        return `Auctions${name}`
      }),
      new RenameRootFields((_operation, name) => {
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1)
        if (privateFields.includes(name)) {
          return `_unused_auctions${capitalizedName}`
        }
        return `auctions${capitalizedName}`
      }),
    ],
  }
}

export const executableCausalitySchema = () => wrapSchema(causalitySubschemaConfig())
