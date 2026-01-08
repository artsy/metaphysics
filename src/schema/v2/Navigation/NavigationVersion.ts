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
import { date } from "../fields/date"

export const NavigationVersionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "NavigationVersion",
  fields: {
    ...InternalIDFields,
    createdAt: date(({ created_at }) => created_at, true),
    items: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(NavigationItemType))
      ),
      description:
        "An ordered list of nested navigation items (e.g., By Price, By Seller, etc.)",
    },
    publishedAt: date(),
    updatedAt: date(({ updated_at }) => updated_at, true),
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
  resolve: (
    _root,
    { groupID, state },
    { navigationGroupLiveLoader, navigationGroupDraftLoader }
  ) => {
    const loader =
      state === "LIVE" ? navigationGroupLiveLoader : navigationGroupDraftLoader

    if (!loader) return null

    return loader(groupID)
  },
}
