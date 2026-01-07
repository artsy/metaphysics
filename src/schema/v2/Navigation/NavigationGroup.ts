import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { NavigationVersionType } from "./NavigationVersion"
import { date } from "schema/v2/fields/date"
import { SlugAndInternalIDFields } from "../object_identification"

const NavigationGroupType = new GraphQLObjectType<any, ResolverContext>({
  name: "NavigationGroup",
  fields: () => ({
    ...SlugAndInternalIDFields,
    createdAt: date(({ created_at }) => created_at, true),
    draftVersion: {
      type: NavigationVersionType,
      resolve: (parent, _args, { navigationGroupDraftLoader }) => {
        if (!navigationGroupDraftLoader) return null

        return navigationGroupDraftLoader(parent.id)
      },
    },
    hasDraftVersion: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ draft_version_id }) => {
        return !!draft_version_id
      },
    },
    hasLiveVersion: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ live_version_id }) => {
        return !!live_version_id
      },
    },
    liveVersion: {
      type: NavigationVersionType,
      resolve: (parent, _args, { navigationGroupLiveLoader }) => {
        if (!navigationGroupLiveLoader) return null

        return navigationGroupLiveLoader(parent.id)
      },
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    updatedAt: date(({ updated_at }) => updated_at, true),
  }),
})

export const navigationGroup: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(NavigationGroupType),
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the navigation group",
    },
  },
  resolve: async (_root, { id }, { navigationGroupLoader }) => {
    if (!navigationGroupLoader) return null

    return navigationGroupLoader(id)
  },
}

export const navigationGroups: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(NavigationGroupType))
  ),
  resolve: async (_root, _args, { navigationGroupsLoader }) => {
    if (!navigationGroupsLoader) {
      return []
    }

    return await navigationGroupsLoader()
  },
}
