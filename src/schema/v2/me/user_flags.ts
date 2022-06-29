import {
  GraphQLError,
  GraphQLFieldConfig,
  GraphQLScalarType,
  Kind,
  ObjectValueNode,
  print,
  ValueNode,
} from "graphql"
import Maybe from "graphql/tsutils/Maybe"
import { camelCase } from "lodash"
import { ResolverContext } from "types/graphql"

export const UserFlagsType = new GraphQLScalarType({
  name: "UserFlagsType",
  description:
    "The user's user_flags. Values of keys in user_flags can be anything and keys may not be known beforehand.",
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast, variables) => {
    if (ast.kind !== Kind.OBJECT) {
      throw new TypeError(
        `Object cannot represent non-object value: ${print(ast)}`
      )
    }

    return parseObject("Object", ast, variables)
  },
})

const deriveAdditionalFlags = async (root, options, loaders) => {
  const { collectorProfileLoader } = loaders
  const computedFlags: { [key: string]: any } = {}

  const result = await collectorProfileLoader(options)
  const { bio, icon, other_relevant_positions } = result
  const profileIsComplete =
    root.profession && bio && icon && other_relevant_positions

  if (!profileIsComplete) {
    computedFlags.collector_profile_incomplete_at = new Date().toISOString()
  }

  // derive other flags and add them to computedFlags

  return computedFlags
}

export const userFlagsResolver = async (root, options, loaders) => {
  const { collectorProfileLoader } = loaders
  if (!collectorProfileLoader) {
    throw new Error("You need to be signed in to perform this action")
  }

  const computedFlags = await deriveAdditionalFlags(root, options, loaders)

  const mergedResult = {
    ...root.user_flags,
    ...computedFlags,
  }

  const res = {}
  const keys = Object.keys(mergedResult)
  keys.forEach((key) => {
    res[camelCase(key)] = mergedResult[key]
  })
  return res
}

export const UserFlags: GraphQLFieldConfig<any, ResolverContext> = {
  type: UserFlagsType,
  description:
    "Hash of arbitrary keys/values. Useful for transient or UI-related preferences.",
  resolve: async (root, options, loaders) => {
    return await userFlagsResolver(root, options, loaders)
  },
}

// custom scalar helpers for UserFlags
const parseObject = (
  typeName: string,
  ast: ObjectValueNode,
  variables: Maybe<{ [key: string]: any }>
) => {
  const value = {}
  ast.fields.forEach((field) => {
    value[field.name.value] = parseLiteral(typeName, field.value, variables)
  })

  return value
}

const parseLiteral = (
  typeName: string,
  ast: ValueNode,
  variables: Maybe<{ [key: string]: any }>
) => {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value)
    case Kind.OBJECT:
      return parseObject(typeName, ast, variables)
    case Kind.LIST:
      return ast.values.map((n) => parseLiteral(typeName, n, variables))
    case Kind.NULL:
      return null
    case Kind.VARIABLE:
      return variables ? variables[ast.name.value] : undefined
    default:
      throw new GraphQLError(
        `${typeName} cannot represent value: ${print(ast)}`
      )
  }
}
