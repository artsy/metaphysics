import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const query = gql`
  {
    article(id: "example") {
      sections {
        ... on ArticleSectionArtworkGrid {
          columns
          artworksConnection(first: 10) {
            totalCount
            edges {
              node {
                slug
              }
            }
          }
        }
      }
    }
  }
`

const runWithGrid = (
  section: Record<string, unknown>,
  artworksLoader: jest.Mock
) => {
  const articleLoader = jest.fn(() =>
    Promise.resolve({ sections: [{ type: "artwork_grid", ...section }] })
  )
  return runQuery(query, { articleLoader, artworksLoader })
}

describe("ArticleSectionArtworkGrid", () => {
  it("resolves columns and artworks with a single batched Gravity call", async () => {
    const artworksLoader = jest.fn(() =>
      Promise.resolve([
        { _id: "a", id: "artwork-a" },
        { _id: "b", id: "artwork-b" },
      ])
    )

    const { article } = await runWithGrid(
      {
        columns: 3,
        artworks: [
          { id: "a", slug: "artwork-a" },
          { id: "b", slug: "artwork-b" },
        ],
      },
      artworksLoader
    )

    expect(artworksLoader).toHaveBeenCalledTimes(1)
    expect(artworksLoader).toHaveBeenCalledWith({
      ids: ["a", "b"],
      batched: true,
    })
    expect(article.sections).toEqual([
      {
        columns: 3,
        artworksConnection: {
          totalCount: 2,
          edges: [
            { node: { slug: "artwork-a" } },
            { node: { slug: "artwork-b" } },
          ],
        },
      },
    ])
  })

  it("preserves Gravity's order and drops artworks missing from the response", async () => {
    const artworksLoader = jest.fn(() =>
      // "artwork-b" is unpublished and absent from the response
      Promise.resolve([
        { _id: "c", id: "artwork-c" },
        { _id: "a", id: "artwork-a" },
      ])
    )

    const { article } = await runWithGrid(
      {
        columns: 2,
        artworks: [
          { id: "c", slug: "artwork-c" },
          { id: "b", slug: "artwork-b" },
          { id: "a", slug: "artwork-a" },
        ],
      },
      artworksLoader
    )

    expect(article.sections[0].artworksConnection).toEqual({
      totalCount: 2,
      edges: [{ node: { slug: "artwork-c" } }, { node: { slug: "artwork-a" } }],
    })
  })

  it("returns an empty connection without calling Gravity when there are no artworks", async () => {
    const artworksLoader = jest.fn()

    const { article } = await runWithGrid(
      { columns: 4, artworks: [] },
      artworksLoader
    )

    expect(artworksLoader).not.toHaveBeenCalled()
    expect(article.sections).toEqual([
      { columns: 4, artworksConnection: { totalCount: 0, edges: [] } },
    ])
  })
})
