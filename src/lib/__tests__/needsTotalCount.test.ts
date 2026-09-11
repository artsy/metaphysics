import { parse, GraphQLResolveInfo, FieldNode } from "graphql"
import gql from "lib/gql"
import { needsTotalCount } from "lib/needsTotalCount"

function infoFromQuery(query: string): GraphQLResolveInfo {
  const doc = parse(query)
  const operation = doc.definitions[0] as any
  const connectionField = operation.selectionSet.selections[0] as FieldNode

  return {
    fieldNodes: [connectionField],
    fragments: {},
  } as any
}

describe("needsTotalCount", () => {
  it("returns true when totalCount is in the selection set", () => {
    const info = infoFromQuery(gql`
      {
        artworksConnection {
          totalCount
          edges {
            node {
              title
            }
          }
        }
      }
    `)

    expect(needsTotalCount(info)).toBe(true)
  })

  it("returns true when pageCursors is in the selection set", () => {
    const info = infoFromQuery(gql`
      {
        artworksConnection {
          pageCursors {
            around {
              cursor
              page
            }
          }
          edges {
            node {
              title
            }
          }
        }
      }
    `)

    expect(needsTotalCount(info)).toBe(true)
  })

  it("returns false when only edges and pageInfo are requested", () => {
    const info = infoFromQuery(gql`
      {
        artworksConnection {
          edges {
            node {
              title
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `)

    expect(needsTotalCount(info)).toBe(false)
  })

  it("returns false when only edges are requested", () => {
    const info = infoFromQuery(gql`
      {
        artworksConnection {
          edges {
            node {
              title
            }
          }
        }
      }
    `)

    expect(needsTotalCount(info)).toBe(false)
  })

  it("returns true when both totalCount and pageCursors are requested", () => {
    const info = infoFromQuery(gql`
      {
        artworksConnection {
          totalCount
          pageCursors {
            around {
              cursor
            }
          }
          edges {
            node {
              title
            }
          }
        }
      }
    `)

    expect(needsTotalCount(info)).toBe(true)
  })
})
