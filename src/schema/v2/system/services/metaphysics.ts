import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLString,
} from "graphql"
import config from "config"
import { ResolverContext } from "types/graphql"

// The config variables found inside here should never contain
// details that we consider to be private, as they are publicly
// accessible.

// These are the current env vars which are exposed at runtime,
// so that you can validate the env at runtime easily.

const mapEnvBooleans = {
  queryTracing: !!config.ENABLE_QUERY_TRACING,
  stitching: !config.DISABLE_SCHEMA_STITCHING,
  stitchingConvection: true,
  stitchingExchange: true,
  stitchingGravity: true,
}

// These are config strings that are exposed at runtime.

const mapEnvStrings = {
  environment: config.NODE_ENV,
}

const MetaphysicsSchema = new GraphQLObjectType<any, ResolverContext>({
  name: "MetaphysicsService",
  fields: () => {
    const fields = {}
    Object.keys(mapEnvBooleans).forEach((key) => {
      fields[key] = {
        type: new GraphQLNonNull(GraphQLBoolean),
      }
    })
    Object.keys(mapEnvStrings).forEach((key) => {
      fields[key] = {
        type: new GraphQLNonNull(GraphQLString),
      }
    })
    return fields
  },
})

// TODO: This isn't being used as a GraphQLFieldConfig, it seems.
const Metaphysics = {
  type: MetaphysicsSchema,
  description: "The schema for Metaphysics' ENV settings",
  args: {},
  resolve: () => ({ ...mapEnvBooleans, ...mapEnvStrings }),
}

export default Metaphysics
