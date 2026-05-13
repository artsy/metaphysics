import {
  GraphQLObjectType,
  GraphQLFieldMap,
  Thunk,
  GraphQLUnionType,
} from "graphql"

type DeprecationOptions = { inVersion: 2 } & (
  | { preferUsageOf: string; reason?: undefined }
  | { reason: string; preferUsageOf?: undefined }
)

export function deprecate(options: DeprecationOptions) {
  const reason = options.reason || `Prefer to use \`${options.preferUsageOf}\`.`
  return `${reason} [Will be removed in v${options.inVersion}]`
}

export function shouldBeRemoved(options: {
  deprecationReason: string | null | undefined
  inVersion: number
  typeName: string
  fieldName: string
}) {
  const reason = options.deprecationReason
  if (reason) {
    const match = reason.match(/\[Will be removed in v(\d+)\]$/)
    if (match) {
      const removeFromVersion = parseInt(match[1], 10)
      return removeFromVersion >= options.inVersion
    } else {
      throw new Error(
        `Use the \`deprecate\` function to define a deprecation. [${options.typeName}.${options.fieldName}]`
      )
    }
  } else {
    return false
  }
}

export function deprecateType<
  T extends GraphQLObjectType<any, any> | GraphQLUnionType
>(options: DeprecationOptions, type: T): T {
  // This is only so that codemods can easily recognize and drop types.
  if (type instanceof GraphQLUnionType) {
    return type
  }

  const deprecationReason = deprecate(
    options.preferUsageOf
      ? {
          inVersion: options.inVersion,
          reason: `The \`${type.name}\` type has been deprecated. Prefer to use the \`${options.preferUsageOf}\` type instead.`,
        }
      : options
  )
  // TODO: This is the code for newer graphql-js versions.
  const fields = (type as any)._fields as Thunk<GraphQLFieldMap<any, any>>
  if (typeof fields === "function") {
    ;(type as any)._fields = () => deprecateFields(deprecationReason, fields())
  } else {
    ;(type as any)._fields = deprecateFields(deprecationReason, fields)
  }
  // const fields = (type as any)._typeConfig.fields as Thunk<
  //   GraphQLFieldMap<any, any>
  // >
  // if (typeof fields === "function") {
  //   ;(type as any)._typeConfig.fields = () =>
  //     deprecateFields(deprecationReason, fields())
  // } else {
  //   ;(type as any)._typeConfig.fields = deprecateFields(
  //     deprecationReason,
  //     fields
  //   )
  // }
  return type
}

function deprecateFields(
  deprecationReason: string,
  fields: GraphQLFieldMap<any, any>
) {
  Object.keys(fields).forEach((fieldName) => {
    fields[fieldName] = { ...fields[fieldName], deprecationReason }
  })
  return fields
}
