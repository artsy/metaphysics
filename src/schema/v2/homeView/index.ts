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
import { HomeViewGenericSectionInterface } from "./sectionTypes/GenericSectionInterface"
import { getSectionsForUser } from "./helpers/getSectionsForUser"
import { registry } from "./sections"
import { isSectionDisplayable } from "./helpers/isSectionDisplayable"
import { HomeViewExperiments } from "./experiments/HomeViewExperiments"

const SectionsConnectionType = connectionWithCursorInfo({
  nodeType: HomeViewGenericSectionInterface,
}).connectionType

const SectionConnection: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(SectionsConnectionType),
  description: "A paginated list of home view sections",
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

export const Section: GraphQLFieldConfig<void, ResolverContext> = {
  type: HomeViewGenericSectionInterface,
  description: "A single home view section, addressed by internal id",
  args: {
    id: {
      description: "The ID of the section",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_parent, args, context, _info) => {
    const { id } = args
    const section = registry[id]

    if (!section) {
      throw new Error(`Section not found: ${id}`)
    }

    if (!isSectionDisplayable(section, context)) {
      throw new Error(`Section is not displayable: ${id}`)
    }

    return section
  },
}

// root homeView field

const HomeViewType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeView",
  description: "Schema for server-driven home view content",
  fields: {
    experiments: HomeViewExperiments,
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
