import {
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { HomeViewSectionType } from "./HomeViewSection"
import { getSectionsForUser } from "./getSectionsForUser"
import { registry } from "./sections"

const SectionsConnectionType = connectionWithCursorInfo({
  nodeType: HomeViewSectionType,
}).connectionType

const SectionConnection: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(SectionsConnectionType),
  args: pageable({}),
  resolve: async (_parent, args, context, _info) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const sections = await getSectionsForUser(context)
    const totalCount = sections.length
    const data = sections.slice(offset, offset + size)

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body: data,
      args,
    })
  },
}

const Section: GraphQLFieldConfig<void, ResolverContext> = {
  type: HomeViewSectionType,
  description: "A home view section",
  args: {
    id: {
      description: "The ID of the section",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_root, { id }, context) => {
    const { meLoader } = context.authenticatedLoaders

    if (!meLoader) throw new Error("You must be signed in to see this content.")

    if (id.length === 0) {
      return null
    }
    return registry[id]
  },
}

// root homeView field

const HomeViewType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeView",
  description: "Experimental schema for new home view",
  fields: {
    sectionsConnection: SectionConnection,
    section: Section,
  },
})

export const HomeView: GraphQLFieldConfig<void, ResolverContext> = {
  type: GraphQLNonNull(HomeViewType),
  description: "Home view content",
  resolve: () => {
    // dummy response object, otherwise the nested fields won’t work
    return {}
  },
}
