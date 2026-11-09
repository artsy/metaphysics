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
import { buildHTTPExecutor } from "@graphql-tools/executor-http"
import { RenameRootFields, RenameTypes, wrapSchema } from "@graphql-tools/wrap"
import type { AsyncExecutor } from "@graphql-tools/utils"
import { buildSchema } from "graphql"
import { ARTNET_USERS_GRAPHQL_URLS } from "./lib/artnetEnv"
import { ResolverContext } from "./types/graphql"
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
  const withPrefixedResolveType = (
    type: GraphQLInterfaceType | GraphQLUnionType
  ) => {
    const { resolveType } = type.toConfig()
    if (!resolveType) return type
    const config = type.toConfig()
    config.resolveType = async (...args: any[]) => {
      const result = await (resolveType as any)(...args)
      return typeof result === "string" ? prefixed(result) : result
    }
    return type instanceof GraphQLInterfaceType
      ? new GraphQLInterfaceType(config as any)
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
  typeDefs: readSDL("schema/artsy.graphql"),
  resolvers,
})

const artnetSchema = prefixSchema(
  makeExecutableSchema({
    typeDefs: readSDL("schema/artnet-coredata.graphql"),
    resolvers: { ...artnetResolvers, DateTime: GraphQLDateTime },
  }),
  ARTNET_PREFIX,
  SHARED_TYPE_NAMES
)

// The users schema is resolved by a remote GraphQL server, whose URL depends on
// the request's Artnet environment. Operations are forwarded as-is (arguments,
// selections, variables), with the same `artnet_` renaming as the schema above.
const httpExecutors = new Map<string, ReturnType<typeof buildHTTPExecutor>>()

const usersExecutor: AsyncExecutor = async (request) => {
  const context = (request.context as unknown) as ResolverContext
  const env = context.artnetEnv()
  const endpoint = ARTNET_USERS_GRAPHQL_URLS[env]
  if (!endpoint) {
    throw new Error(`The Artnet users service isn't configured for "${env}"`)
  }

  let executor = httpExecutors.get(endpoint)
  if (!executor) {
    executor = buildHTTPExecutor({
      endpoint,
      headers: (executionRequest) => {
        const { xArtnetToken, xArtnetUserID } =
          ((executionRequest?.context as unknown) as ResolverContext) ?? {}
        return {
          ...(xArtnetToken && { "x-artnet-token": xArtnetToken }),
          ...(xArtnetUserID && { "x-artnet-user-id": xArtnetUserID }),
        }
      },
    })
    httpExecutors.set(endpoint, executor)
  }
  return executor(request) as any
}

const keepName = (name: string) =>
  ["Query", "Mutation", "Subscription", ...SHARED_TYPE_NAMES].includes(name)

const artnetUsersSchema = wrapSchema({
  schema: buildSchema(readSDL("schema/artnet-users.graphql")),
  executor: usersExecutor,
  transforms: [
    new RenameTypes((name) =>
      keepName(name) ? name : `${ARTNET_PREFIX}${name}`
    ),
    new RenameRootFields(
      (_operation, fieldName) => `${ARTNET_PREFIX}${fieldName}`
    ),
  ],
})

// Root fields from all schemas (`Query`) are merged.
export const schema = mergeSchemas({
  schemas: [artsySchema, artnetSchema, artnetUsersSchema],
})
