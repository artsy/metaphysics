import { GraphQLObjectType, GraphQLNonNull, GraphQLBoolean } from "graphql"
import config from "config"

// These are the current env vars

const mapEnvBooleans = {
  environment: !!config.NODE_ENV,
  queryTracing: !!config.ENABLE_QUERY_TRACING,
  headpDumps: !!config.ENABLE_HEAPDUMPS,
  stitching: !!config.ENABLE_SCHEMA_STITCHING,
  stitchingGravity: !!config.ENABLE_GRAVQL_ONLY_STITCHING,
  stitchingConvection: !!config.ENABLE_CONSIGNMENTS_STITCHING,
  stitchingExchange: !!config.ENABLE_ECOMMERCE_STITCHING,
}

const MetaphysicsSchema = new GraphQLObjectType({
  name: "Metaphysics",
  fields: () => {
    const fields = {}
    Object.keys(mapEnvBooleans).forEach(key => {
      fields[key] = {
        type: new GraphQLNonNull(GraphQLBoolean),
      }
    })
    return fields
  },
})

const Metaphysics = {
  type: MetaphysicsSchema,
  description: "The schema for Metaphysic's ENV settings",
  args: {},
  resolve: () => mapEnvBooleans,
}

export default Metaphysics
