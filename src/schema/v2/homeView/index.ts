import { GraphQLObjectType, GraphQLFieldConfig, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { STUB_SECTIONS } from "./stubData"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { HomeViewSectionType } from "./HomeViewSection"

const SectionsConnectionType = connectionWithCursorInfo({
  nodeType: HomeViewSectionType,
}).connectionType

const SectionConnection: GraphQLFieldConfig<any, ResolverContext> = {
  type: SectionsConnectionType,
  args: pageable({}),
  resolve: async (_parent, args, _context, _info) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const totalCount = STUB_SECTIONS.length
    const data = STUB_SECTIONS.slice(offset, offset + size)

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

// root homeView field

const HomeViewType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeView",
  description: "Experimental schema for new home view",
  fields: {
    sectionsConnection: SectionConnection,
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
