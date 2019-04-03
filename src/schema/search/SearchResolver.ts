import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors, pageToCursor } from "schema/fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"
import { GraphQLResolveInfo, visit, BREAK } from "graphql"
import { ResolverContext } from "types/graphql"
import { Searchable } from "schema/searchable"
import { SearchableItem } from "schema/SearchableItem"

export class SearchResolver {
  private args: any
  private context: any
  private info: any

  constructor(args: any, context: any, info: any) {
    this.args = args
    this.context = context
    this.info = info
  }

  fetch(searchResultItem, { artistLoader, artworkLoader }: ResolverContext) {
    const loaderMapping = {
      Artist: artistLoader,
      Artwork: artworkLoader,
    }

    const loader = loaderMapping[searchResultItem.label]

    if (loader) {
      return loader(searchResultItem.id)
    }
  }

  // Fetch the full object if the GraphQL query includes any inline fragments
  // referencing the search result item's type (like Artist or Artwork)
  shouldFetch(searchResultItem, info: GraphQLResolveInfo) {
    let fetch = false

    visit(info.fieldNodes[0], {
      Field(node) {
        if (node.name.value === "node") {
          visit(node, {
            InlineFragment(node) {
              if (
                node.typeCondition &&
                (node.typeCondition.name.value !== Searchable.name &&
                  node.typeCondition.name.value !== SearchableItem.name) &&
                node.typeCondition.name.value === searchResultItem.label
              ) {
                fetch = true
                return BREAK
              }
            },
            FragmentSpread(_node) {
              throw new Error(
                "Named fragment spreads are currently unsupported for search."
              )
            },
          })
        }
      },
    })

    return fetch
  }

  processSearchResultItem(
    searchResultItem,
    info: GraphQLResolveInfo,
    context: ResolverContext
  ) {
    if (this.shouldFetch(searchResultItem, info)) {
      return this.fetch(searchResultItem, context).then(response => {
        return {
          ...response,
          __typename: searchResultItem.label,
        }
      })
    } else {
      return Promise.resolve({
        ...searchResultItem,
        __typename: "SearchableItem",
      })
    }
  }

  resolve() {
    const pageOptions = convertConnectionArgsToGravityArgs(this.args)
    if (!!this.args.page) pageOptions.page = this.args.page
    const { page, size, offset, ...rest } = pageOptions
    const gravityArgs = {
      ...rest,
      page,
      size,
      entities: this.args.entities,
      total_count: true,
    }

    return this.context.searchLoader(gravityArgs).then(({ body, headers }) => {
      const totalCount = parseInt(headers["x-total-count"])
      const pageCursors = createPageCursors(pageOptions, totalCount)
      const totalPages = Math.ceil(totalCount / size)

      let results = body
      if (this.args.aggregations) {
        results = body.results
      }
      return Promise.all(
        results.map(searchResultItem =>
          this.processSearchResultItem(
            searchResultItem,
            this.info,
            this.context
          )
        )
      ).then(processedSearchResults => {
        const connection = connectionFromArraySlice(
          processedSearchResults,
          this.args,
          {
            arrayLength: totalCount,
            sliceStart: offset,
          }
        )

        const pageInfo = connection.pageInfo
        pageInfo.endCursor = pageToCursor(page + 1, size)

        return {
          aggregations: body.aggregations,
          pageCursors: pageCursors,
          totalCount,
          ...connection,
          pageInfo: {
            ...pageInfo,
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages,
          },
        }
      })
    })
  }
}
