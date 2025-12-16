import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { InternalIDFields } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import { NavigationVersion, NavigationVersionType } from "./NavigationVersion"
import { date } from "schema/v2/fields/date"

const NavigationGroupType = new GraphQLObjectType<any, ResolverContext>({
  name: "NavigationGroup",
  fields: () => ({
    ...InternalIDFields,
    createdAt: date(),
    draftVersion: {
      type: NavigationVersionType,
      resolve: (parent, _args, context, info) => {
        if (!parent.draft_version_id) return null
        if (!NavigationVersion.resolve) return null

        return NavigationVersion.resolve(
          parent,
          { groupID: parent.id, state: "DRAFT" },
          context,
          info
        )
      },
    },
    liveVersion: {
      type: NavigationVersionType,
      resolve: (parent, _args, context, info) => {
        if (!parent.live_version_id) return null
        if (!NavigationVersion.resolve) return null

        return NavigationVersion.resolve(
          parent,
          { groupID: parent.id, state: "LIVE" },
          context,
          info
        )
      },
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    updatedAt: date(),
  }),
})

export const navigationGroup: GraphQLFieldConfig<void, ResolverContext> = {
  type: NavigationGroupType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the navigation group",
    },
  },
  resolve: async (_root, { id }, { navigationGroupLoader }) => {
    if (!navigationGroupLoader) {
      return null
    }

    const { body } = await navigationGroupLoader(id)
    return body
  },
}

export const navigationGroups: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(NavigationGroupType),
  resolve: async (_root, _args, { navigationGroupsLoader }) => {
    if (!navigationGroupsLoader) {
      return []
    }

    const { body } = await navigationGroupsLoader()
    return body
  },
}
