import { GraphQLSchema } from "graphql"
import { transformSchema, FilterTypes } from "graphql-tools"
import { RenameIDFields } from "./RenameIDFields"
import { RenameArguments } from "./RenameArguments"
import { RemoveDeprecatedFields } from "./RemoveDeprecatedFields"

// TODO: Flip this switch before we go public with v2 and update clients. Until
//       then this gives clients an extra window of opportunity to update.
export const FILTER_DEPRECATIONS = false

// These should not show up in v2 at all.
const FilterTypeNames = [
  "DoNotUseThisPartner",
  "PartnerShow",
  ...(FILTER_DEPRECATIONS
    ? [
        // TODO: This type is empty after removing PartnerShow.
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
  return transformSchema(schema, [
    new FilterTypes(type => {
      return !opt.filterTypes.includes(type.name)
    }),
    new RenameIDFields(
      opt.allowedGravityTypesWithNullableIDField,
      opt.allowedNonGravityTypesWithNullableIDField,
      opt.stitchedTypePrefixes,
      opt.filterIDFieldFromTypes
    ),
    new RenameArguments((_field, arg) => (arg.name === "__id" ? "id" : null)),
    ...(FILTER_DEPRECATIONS
      ? [
          new RemoveDeprecatedFields({
            fromVersion: 2,
            filter: (type, _field) => {
              return !SkipDeprecatedFieldsOfTypes.includes(type.name)
            },
          }),
        ]
      : []),
  ])
}
