import { readFileSync } from "fs"
import { join } from "path"
import { makeExecutableSchema, mergeSchemas } from "@graphql-tools/schema"
import { MapperKind, mapSchema, getRootTypeMap } from "@graphql-tools/utils"
import {
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLUnionType,
  isSpecifiedScalarType,
} from "graphql"
import { GraphQLDateTime } from "graphql-scalars"
import { artnetResolvers, resolvers } from "./resolvers"

const readSDL = (file: string) => readFileSync(join(__dirname, file), "utf8")

const ARTNET_PREFIX = "artnet_"

// Types that are shared with the Artsy schema, so they keep their names.
const SHARED_TYPE_NAMES = ["BigInt"]

/**
 * Prefixes every type (except the root types and `sharedTypeNames`) and every root field of a schema,
 * so it can be merged into another schema without name collisions.
 */
function prefixSchema(
  schema: GraphQLSchema,
  prefix: string,
  sharedTypeNames: string[] = []
): GraphQLSchema {
  const unprefixedTypeNames = new Set([
    ...[...getRootTypeMap(schema).values()].map((type) => type.name),
    ...sharedTypeNames,
  ])
  const prefixed = (name: string) => `${prefix}${name}`

  // `resolveType` functions return type names, which are about to change.
  const withPrefixedResolveType = (type) => {
    const { resolveType } = type.toConfig()
    if (!resolveType) return type
    const config = type.toConfig()
    config.resolveType = async (...args) => {
      const result = await resolveType(...args)
      return typeof result === "string" ? prefixed(result) : result
    }
    return type instanceof GraphQLInterfaceType
      ? new GraphQLInterfaceType(config)
      : new GraphQLUnionType(config as any)
  }

  return mapSchema(schema, {
    [MapperKind.TYPE]: (type) => {
      if (
        unprefixedTypeNames.has(type.name) ||
        isSpecifiedScalarType(type) ||
        type.name.startsWith("__")
      ) {
        return undefined
      }
      if (
        type instanceof GraphQLInterfaceType ||
        type instanceof GraphQLUnionType
      ) {
        type = withPrefixedResolveType(type)
      }
      const config = (type as GraphQLObjectType).toConfig()
      const Ctor = type.constructor as new (config: any) => typeof type
      return new Ctor({ ...config, name: prefixed(type.name) })
    },
    [MapperKind.ROOT_FIELD]: (_fieldConfig, fieldName) => [
      prefixed(fieldName),
      _fieldConfig,
    ],
  })
}

const artsySchema = makeExecutableSchema({
  typeDefs: readSDL("artsy-schema.graphql"),
  resolvers,
})

const artnetSchema = prefixSchema(
  makeExecutableSchema({
    typeDefs: readSDL("artnet-schema.graphql"),
    resolvers: { ...artnetResolvers, DateTime: GraphQLDateTime },
  }),
  ARTNET_PREFIX,
  SHARED_TYPE_NAMES
)

// Root fields from both schemas (`Query`) are merged.
export const schema = mergeSchemas({ schemas: [artsySchema, artnetSchema] })
