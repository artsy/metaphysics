import { GraphQLSchema, isNullableType } from "graphql"
import { transformSchema, FilterTypes, RenameTypes } from "graphql-tools"
import { RenameArguments } from "./RenameArguments"
import { shouldBeRemoved } from "lib/deprecation"
import { FilterFields } from "./FilterFields"
import { RenameFields } from "./RenameFields"
import {
  GravityIDFields,
  NullableIDField,
  InternalIDFields,
  SlugAndInternalIDFields,
} from "schema/object_identification"

// TODO: Flip this switch before we go public with v2 and update clients. Until
//       then this gives clients an extra window of opportunity to update.
export const FILTER_DEPRECATIONS = false

// These should not show up in v2 at all.
const FilterTypeNames = [
  "DoNotUseThisPartner",
  ...(FILTER_DEPRECATIONS
    ? [
        // TODO: These are empty after removing all fields from PartnerShow.
        "PartnerShow",
        "ArtworkContextPartnerShow",
      ]
    : []),
]

// Omit this id field entirely from the v2 schema, as it's a no-op
const FilterIDFieldFromTypeNames = ["SaleArtworkHighestBid"]

// TODO: These types should have their id fields renamed to internalID upstream,
//       but that requires us to do some transformation work _back_ on the v1
//       schema for it to remain backwards compatible, so we can do that at a
//       later time.
const StitchedTypePrefixes = [
  "Marketing", // KAWS
  "Commerce", // Exchange
]

// TODO: What shall we do here? Have them conform to our formal description?
const SkipDeprecatedFieldsOfTypes = [
  "AnalyticsPartnerStats",
  "CommerceLineItem",
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
    filterTypes: FilterTypeNames,
    filterIDFieldFromTypes: FilterIDFieldFromTypeNames,
    ...options,
  }
  const allowedTypesWithNullableIDField = [
    ...opt.allowedGravityTypesWithNullableIDField,
    ...opt.allowedNonGravityTypesWithNullableIDField,
  ]
  return transformSchema(schema, [
    new FilterTypes(type => {
      return !opt.filterTypes.includes(type.name)
    }),
    new RenameTypes(type => {
      return type === "PartnerShowEventType" ? "PartnerShowEvent" : undefined
    }),
    new FilterFields(
      (type, field) =>
        field.name !== "id" || !opt.filterIDFieldFromTypes.includes(type.name)
    ),
    new RenameFields((type, field) => {
      if (field.name === "id") {
        if (
          isNullableType(field.type) &&
          !allowedTypesWithNullableIDField.includes(type.name)
        ) {
          throw new Error(`Do not add new nullable id fields (${type.name})`)
        } else {
          if (field.description === SlugAndInternalIDFields.id.description) {
            return "slug"
          } else if (
            field.description === GravityIDFields.id.description ||
            (field.description === NullableIDField.id.description &&
              opt.allowedGravityTypesWithNullableIDField.includes(type.name))
          ) {
            return "internalID"
          } else if (
            field.description === InternalIDFields.id.description ||
            field.description === SlugAndInternalIDFields.id.description ||
            (field.description === NullableIDField.id.description &&
              opt.allowedNonGravityTypesWithNullableIDField.includes(
                type.name
              )) ||
            opt.stitchedTypePrefixes.some(prefix =>
              type.name.startsWith(prefix)
            )
          ) {
            return "internalID"
          } else {
            throw new Error(`Do not add new id fields (${type.name})`)
          }
        }
      } else if (field.name === "_id") {
        return "internalID"
      } else if (field.name === "__id") {
        return "id"
      }
      return undefined
    }),
    new RenameFields((_type, field) => {
      if (field.name.startsWith("v2_")) {
        return field.name.substring(3)
      }
    }),
    new RenameArguments((_field, arg) => (arg.name === "__id" ? "id" : null)),
    ...(FILTER_DEPRECATIONS
      ? [
          new FilterFields(
            (type, field) =>
              !field.deprecationReason ||
              (!SkipDeprecatedFieldsOfTypes.includes(type.name) &&
                !shouldBeRemoved({
                  inVersion: 2,
                  deprecationReason: field.deprecationReason,
                  typeName: type.name,
                  fieldName: field.name,
                }))
          ),
        ]
      : []),
  ])
}
