import { GraphQLSchema, isNullableType } from "graphql"
import { transformSchema } from "graphql-tools"
import { RenameFields } from "./RenameFields"

// TODO: These types should have their id fields renamed to internalID upstream,
//       but that requires us to do some transformation work _back_ on the v1
//       schema for it to remain backwards compatible, so we can do that at a
//       later time.
const StitchedTypePrefixes = [
  "Marketing", // KAWS
  "Commerce", // Exchange
]

// FIXME: ID fields shouldn't be nullable, so figure out what the deal is with
//        these.
const KnownGravityTypesWithNullableIDFields = [
  "MarketingCollectionQuery",
  "FeaturedLinkItem",
  "HomePageModulesParams",
  "Image",
  "FairExhibitor",
]
const KnownNonGravityTypesWithNullableIDFields = [
  "Conversation",
  "ConsignmentSubmission",
]

export interface TransformToV2Options {
  stitchedTypePrefixes: string[]
  allowedGravityTypesWithNullableIDField: string[]
  allowedNonGravityTypesWithNullableIDField: string[]
  filterTypes: string[]
  filterIDFieldFromTypes: string[]
}

export const transformToV2 = (
  schema: GraphQLSchema,
  options: Partial<TransformToV2Options> = {}
): GraphQLSchema => {
  const opt = {
    allowedGravityTypesWithNullableIDField: KnownGravityTypesWithNullableIDFields,
    allowedNonGravityTypesWithNullableIDField: KnownNonGravityTypesWithNullableIDFields,
    stitchedTypePrefixes: StitchedTypePrefixes,
    ...options,
  }
  const allowedTypesWithNullableIDField = [
    ...opt.allowedGravityTypesWithNullableIDField,
    ...opt.allowedNonGravityTypesWithNullableIDField,
  ]
  return transformSchema(schema, [
    new RenameFields((type, field) => {
      // Only rename ID fields on stitched services.
      if (
        !opt.stitchedTypePrefixes.some(prefix => type.name.startsWith(prefix))
      ) {
        return undefined
      }
      if (field.name === "id") {
        if (
          isNullableType(field.type) &&
          !allowedTypesWithNullableIDField.includes(type.name)
        ) {
          throw new Error(`Do not add new nullable id fields (${type.name})`)
        } else {
          return "internalID"
        }
      }
      return undefined
    }),
    new RenameFields((_type, field) => {
      if (field.name.startsWith("v2_")) {
        return field.name.substring(3)
      }
    }),
  ])
}
