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

export const userFlagsResolver = async (root, _options, loaders) => {
  const { meLoader } = loaders
  const { user_flags: userFlags } = root
  if (!meLoader) {
    throw new Error("You need to be signed in to perform this action")
  }

  const res = {}
  const keys = Object.keys(userFlags)
  keys.forEach((key) => {
    res[camelCase(key)] = userFlags[key]
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
