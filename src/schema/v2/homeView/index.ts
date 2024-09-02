import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
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
  resolve: (_parent, args, context, _info) => {
    const { id } = args
    const section = registry[id]
    const userIsAuthenticated = !!context.accessToken

    if (!section) {
      throw new Error(`Section not found: ${id}`)
    }

    if (section.requiresAuthentication && !userIsAuthenticated) {
      throw new Error(`Section requires authenticated user: ${id}`)
    }

    return section
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
