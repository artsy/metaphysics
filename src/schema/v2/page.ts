import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLID,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { markdown } from "./fields/markdown"
import { IDFields } from "./object_identification"

export interface Page {
  _id: string
  content?: string
  created_at: string
  id: string
  name: string
  published?: boolean
}

export const pageType = new GraphQLObjectType<Page, ResolverContext>({
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

export const page: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  type: new GraphQLNonNull(pageType),
  resolve: (_source, { id }, { pageLoader }) => {
    return pageLoader(id)
  },
}
