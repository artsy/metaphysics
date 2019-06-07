import {
  GraphQLSchema,
  GraphQLObjectType,
  visit,
  Kind,
  GraphQLInterfaceType,
  GraphQLUnionType,
  getNamedType,
  TypeInfo,
  visitWithTypeInfo,
  isLeafType,
  isNullableType,
} from "graphql"
import { transformSchema, Transform, Request, FilterTypes } from "graphql-tools"
import {
  visitSchema,
  VisitSchemaKind,
  TypeVisitor,
} from "graphql-tools/dist/transforms/visitSchema"
import {
  createResolveType,
  fieldToFieldConfig,
} from "graphql-tools/dist/stitching/schemaRecreation"
import {
  GravityIDFields,
  InternalIDFields,
  NullableIDField,
} from "../object_identification"

// These should not show up in v2 at all.
const FilterTypeNames = ["DoNotUseThisPartner"]

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

class IDTransforms implements Transform {
  private newSchema?: GraphQLSchema

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private allowedGravityTypesWithNullableIDField: string[],
    private allowedNonGravityTypesWithNullableIDField: string[],
    private stitchedTypePrefixes: string[],
    private filterIDFieldFromTypes: string[]
  ) {}

  private get allowedTypesWithNullableIDField() {
    return [
      ...this.allowedGravityTypesWithNullableIDField,
      ...this.allowedNonGravityTypesWithNullableIDField,
    ]
  }

  private transformFields(
    type: GraphQLObjectType<any, any> | GraphQLInterfaceType
  ) {
    const fields = type.getFields()
    const newFields = {}

    const resolveType = createResolveType((_name, type) => type)

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName]
      if (field.name === "id") {
        if (!this.filterIDFieldFromTypes.includes(type.name)) {
          if (
            isNullableType(field.type) &&
            !this.allowedTypesWithNullableIDField.includes(type.name)
          ) {
            throw new Error(`Do not add new nullable id fields (${type.name})`)
          } else {
            if (
              field.description === GravityIDFields.id.description ||
              (field.description === NullableIDField.id.description &&
                this.allowedGravityTypesWithNullableIDField.includes(type.name))
            ) {
              newFields["gravityID"] = {
                ...fieldToFieldConfig(field, resolveType, true),
                resolve: ({ id }) => id,
                name: "gravityID",
              }
            } else if (
              field.description === InternalIDFields.id.description ||
              (field.description === NullableIDField.id.description &&
                this.allowedNonGravityTypesWithNullableIDField.includes(
                  type.name
                )) ||
              this.stitchedTypePrefixes.some(prefix =>
                type.name.startsWith(prefix)
              )
            ) {
              newFields["internalID"] = {
                ...fieldToFieldConfig(field, resolveType, true),
                resolve: ({ id }) => id,
                name: "internalID",
              }
            } else {
              throw new Error(`Do not add new id fields (${type.name})`)
            }
          }
        }
      } else if (field.name === "_id") {
        newFields["internalID"] = {
          ...fieldToFieldConfig(field, resolveType, true),
          resolve: ({ _id }) => _id,
          name: "internalID",
        }
      } else if (field.name === "__id") {
        newFields["id"] = {
          ...fieldToFieldConfig(field, resolveType, true),
          resolve: ({ __id }) => __id,
          name: "id",
        }
      } else {
        newFields[fieldName] = fieldToFieldConfig(field, resolveType, true)
      }
    })

    return newFields
  }

  /**
   * Rename ID fields in object and interface types.
   */
  public transformSchema(schema: GraphQLSchema): GraphQLSchema {
    if (this.newSchema) {
      throw new Error("Did not expect to be ran twice!")
    }

    // Keep a reference to all new interface types, as we'll need them to define
    // them on the new object types.
    const newInterfaces: { [name: string]: GraphQLInterfaceType } = {}

    const newSchema = visitSchema(schema, {
      [VisitSchemaKind.OBJECT_TYPE]: ((type: GraphQLObjectType<any, any>) => {
        return new GraphQLObjectType({
          name: type.name,
          description: type.description,
          astNode: type.astNode,
          fields: this.transformFields(type),
          extensionASTNodes: type.extensionASTNodes,
          isTypeOf: type.isTypeOf,
          interfaces: type
            .getInterfaces()
            .map(iface => newInterfaces[iface.name]),
        })
      }) as TypeVisitor,

      [VisitSchemaKind.INTERFACE_TYPE]: ((type: GraphQLInterfaceType) => {
        const newInterface = new GraphQLInterfaceType({
          name: type.name,
          description: type.description,
          astNode: type.astNode,
          fields: this.transformFields(type),
          resolveType: type.resolveType,
          extensionASTNodes: type.extensionASTNodes,
        })
        newInterfaces[newInterface.name] = newInterface
        return newInterface
      }) as TypeVisitor,
    })

    this.newSchema = newSchema
    return newSchema
  }

  /**
   * Map source data to renamed ID fields.
   */
  public transformRequest(originalRequest: Request): Request {
    const typeInfo = new TypeInfo(this.newSchema!)

    const newDocument = visit(
      originalRequest.document,
      visitWithTypeInfo(typeInfo, {
        [Kind.FIELD]: {
          enter: node => {
            // This is the only field you can select on a union type, which is
            // why union types don’t have a `getFields()` method. But seeing as
            // we don’t care about renaming that field anyways, might as well
            // just short-cut it here.
            if (node.name.value === "__typename") {
              return
            }

            const type = getTypeWithSelectableFields(typeInfo)
            const field = type.getFields()[node.name.value]

            if (
              node.name.value === "internalID" &&
              field.description === GravityIDFields._id.description
            ) {
              return {
                ...node,
                name: {
                  ...node.name,
                  value: "_id",
                },
              }
            } else if (
              node.name.value === "gravityID" ||
              node.name.value === "internalID"
            ) {
              return {
                ...node,
                name: {
                  ...node.name,
                  value: "id",
                },
              }
            } else if (node.name.value === "id") {
              return {
                ...node,
                name: {
                  ...node.name,
                  value: "__id",
                },
              }
            }
          },
        },
      })
    )

    return {
      ...originalRequest,
      document: newDocument,
    }
  }

  // FIXME: We need this nonetheless, otherwise aliasing fields breaks.
  //
  // TODO: If we want to make this generic for upstream usage, use `transformResult` instead of the inline resolver in transform schema
  // public transformResult(result: Result): Result {
  //   return result
  // }
}

// FIXME: Unsure why the `typeInfo` methods return `any`.
function getTypeWithSelectableFields(
  typeInfo: TypeInfo
): GraphQLObjectType<any, any> | GraphQLInterfaceType {
  const type = getNamedType(typeInfo.getType())
  return isLeafType(type) || type instanceof GraphQLUnionType
    ? getNamedType(typeInfo.getParentType())
    : type
}

export interface TransformToV2Options {
  stitchedTypePrefixes: string[]
  allowedGravityTypesWithNullableIDField: string[]
  allowedNonGravityTypesWithNullableIDField: string[]
  filterTypes: string[]
  filterIDFieldFromTypes: string[]
}

export const transformToV2 = (
  schema: GraphQLSchema,
  options: Partial<TransformToV2Options>
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
    new FilterTypes(type => !opt.filterTypes.includes(type.name)),
    new IDTransforms(
      opt.allowedGravityTypesWithNullableIDField,
      opt.allowedNonGravityTypesWithNullableIDField,
      opt.stitchedTypePrefixes,
      opt.filterIDFieldFromTypes
    ),
  ])
}
