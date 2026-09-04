import {
  GraphQLFieldConfig,
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLID,
} from "graphql"
import { ResolverContext } from "types/graphql"

const DeviceType = new GraphQLObjectType<any, ResolverContext>({
  name: "Device",
  fields: {
    // FIXME: Use the InternalIDFields
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Unique ID for this device",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Name of the device",
    },
    token: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The device token",
    },
    appId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "E.g., net.artsy.artsy",
    },
    production: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "If device is beta/dev or prod.",
    },
    platform: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Either android or ios",
    },
  },
})

export const Devices: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DeviceType))),
  resolve: async (root, _args, { devicesLoader }) => {
    if (!devicesLoader) return []

    if (!root.id) {
      return []
    }

    const params = { user_id: root.id }
    const data = await devicesLoader(params)

    return data?.body ?? []
  },
}
