import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLList,
} from "graphql"
import { ResolverContext } from "types/graphql"
import AuthorType from "../author"
import cached from "../fields/cached"
import { NodeInterface, IDFields } from "../object_identification"
import resolveResponse from "contentful-resolve-response"

export const ContentfulArticleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ContentfulArticle",
  interfaces: [NodeInterface],
  fields: () => ({
    ...IDFields,
    cached,
    authors: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AuthorType))),
      resolve: (content) => {
        return content.authors.map((author) => author.fields)
      },
    },
    title: {
      type: GraphQLString,
    },
    sections: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      resolve: (content) => {
        return content.sections.map((section) => {
          return section.fields.body.content
            .map((content) => content.content.map((c) => c.value).join(" "))
            .join(" ")
        })
      },
    },
  }),
})

export const ContentfulArticle: GraphQLFieldConfig<void, ResolverContext> = {
  type: ContentfulArticleType,
  description: "An Article",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Article",
    },
  },
  resolve: async (_root, { id }, { contentfulArticleLoader }) => {
    return contentfulArticleLoader(id).then((entry) => {
      const resolved = resolveResponse(entry)

      return resolved[0].fields
    })
  },
}

export const ContentfulArticles: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(ContentfulArticle.type))
  ),
  description: "A list of Articles",
  resolve: async (_root, {}, { contentfulArticlesLoader }) => {
    const articles = await contentfulArticlesLoader()
    const resolved = resolveResponse(articles)

    return resolved.map((article) => article.fields)
  },
}
