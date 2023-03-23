import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLID,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { markdown } from "../fields/markdown"
import { connectionWithCursorInfo } from "../fields/pagination"
import { IDFields } from "../object_identification"

interface PageGravityResponse {
  _id: string
  content?: string
  created_at: string
  id: string
  name: string
  published?: boolean
}

export const PageType = new GraphQLObjectType<
  PageGravityResponse,
  ResolverContext
>({
  name: "Page",
  fields: {
    ...IDFields,
    content: markdown((page) => page.content),
    name: { type: new GraphQLNonNull(GraphQLString) },
    published: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (page) => !!page.published,
    },
  },
})

export const Page: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  type: new GraphQLNonNull(PageType),
  resolve: (_source, { id }, { pageLoader }) => {
    return pageLoader(id)
  },
}

export const PageConnectionType = connectionWithCursorInfo({
  nodeType: PageType,
}).connectionType
