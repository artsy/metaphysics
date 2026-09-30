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
            pageCursors {
              around {
                page
              }
            }
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
  it("resolves columns and artworks with a single Gravity call by internal id", async () => {
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
    expect(artworksLoader).toHaveBeenCalledWith({ ids: ["a", "b"] })
    expect(article.sections).toEqual([
      {
        columns: 3,
        artworksConnection: {
          totalCount: 2,
          pageCursors: { around: [{ page: 1 }] },
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

    expect(article.sections[0].artworksConnection).toMatchObject({
      totalCount: 2,
      edges: [{ node: { slug: "artwork-c" } }, { node: { slug: "artwork-a" } }],
    })
  })

  it("skips artworks without an id and caps the request at Gravity's 100-id limit", async () => {
    const artworksLoader = jest.fn(() => Promise.resolve([]))
    const artworks = [
      { id: null, slug: "no-id" },
      ...Array.from({ length: 150 }, (_, i) => ({ id: `id-${i}` })),
    ]

    await runWithGrid({ columns: 3, artworks }, artworksLoader)

    const [{ ids }] = artworksLoader.mock.calls[0] as any
    expect(ids).toHaveLength(100)
    expect(ids[0]).toEqual("id-0")
    expect(ids[99]).toEqual("id-99")
  })

  it("returns a complete empty connection without calling Gravity when there are no artworks", async () => {
    const artworksLoader = jest.fn()

    const { article } = await runWithGrid(
      { columns: 4, artworks: [] },
      artworksLoader
    )

    expect(artworksLoader).not.toHaveBeenCalled()
    expect(article.sections).toEqual([
      {
        columns: 4,
        artworksConnection: {
          totalCount: 0,
          pageCursors: { around: [{ page: 1 }] },
          edges: [],
        },
      },
    ])
  })
})
