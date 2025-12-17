import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { NavigationItemType } from "./NavigationItem"

export const NavigationVersionType = new GraphQLObjectType({
  name: "NavigationVersion",
  fields: {
    ...InternalIDFields,
    items: {
      type: new GraphQLList(NavigationItemType),
      description:
        "An ordered list of navigation items (e.g., By Price, By Seller, etc.)",
    },
  },
})

export const NavigationVersion: GraphQLFieldConfig<void, ResolverContext> = {
  type: NavigationVersionType,
  description:
    "A snapshot of the server-driven navigation structure (e.g., What’s New -> By Price -> Art under $500, etc.)",
  args: {
    groupID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    state: {
      type: new GraphQLEnumType({
        name: "NavigationVersionState",
        values: {
          LIVE: { value: "LIVE" },
          DRAFT: { value: "DRAFT" },
        },
      }),
      defaultValue: "LIVE",
    },
  },
  resolve: async (
    _root,
    { groupID, state },
    { navigationGroupLiveLoader, navigationGroupDraftLoader }
  ) => {
    const loader =
      state === "LIVE" ? navigationGroupLiveLoader : navigationGroupDraftLoader

    if (!loader) return null

    return await loader(groupID)
  },
}
