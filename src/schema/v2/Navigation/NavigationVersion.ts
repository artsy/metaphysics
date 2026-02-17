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

export const NavigationVersionStateEnum = new GraphQLEnumType({
  name: "NavigationVersionState",
  values: {
    LIVE: { value: "LIVE" },
    DRAFT: { value: "DRAFT" },
  },
})

export const NavigationVersion: GraphQLFieldConfig<void, ResolverContext> = {
  type: NavigationVersionType,
  description:
    "A snapshot of the server-driven navigation structure (e.g., What's New -> By Price -> Art under $500, etc.). Fetch by groupID + state for public/cached access, or by id for admin-specific lookups.",
  args: {
    groupID: {
      type: GraphQLString,
      description:
        "The ID of the navigation group (e.g., 'whats-new'). Used with state for public UI lookups with heavy caching (LIVE) or admin preview (DRAFT).",
    },
    state: {
      type: NavigationVersionStateEnum,
      defaultValue: "LIVE",
      description:
        "The state of the version (LIVE or DRAFT). LIVE uses unauthenticated/cached loader, DRAFT uses authenticated/uncached loader for admin preview.",
    },
    id: {
      type: GraphQLString,
      description:
        "The internal ID of a specific navigation version. For admin UI use only, always uses authenticated loader.",
    },
  },
  resolve: (
    _root,
    { groupID, state, id },
    {
      navigationGroupLiveLoader,
      navigationGroupDraftLoader,
      navigationVersionLoader,
    }
  ) => {
    // Prefer direct version ID lookup if provided
    if (id) {
      if (!navigationVersionLoader) return null
      return navigationVersionLoader(id)
    }

    // Fall back to group-based lookup
    if (!groupID) {
      throw new Error("Either id or groupID must be provided")
    }

    const loader =
      state === "LIVE" ? navigationGroupLiveLoader : navigationGroupDraftLoader

    if (!loader) return null

    return loader(groupID)
  },
}
