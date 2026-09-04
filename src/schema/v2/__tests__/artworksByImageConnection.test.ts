import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("artworksByImageConnection", () => {
  const artworks = [
    { id: "artwork-1", title: "Artwork 1" },
    { id: "artwork-2", title: "Artwork 2" },
  ]

  const mockArtworksByImageLoader = jest.fn(() =>
    Promise.resolve({
      body: { hits: artworks },
      headers: { "x-total-count": "2" },
    })
  )

  const context = {
    artworksByImageLoader: mockArtworksByImageLoader,
  } as any

  beforeEach(() => {
    mockArtworksByImageLoader.mockClear()
  })

  it("passes the snake_cased s3 args to the gravity loader", async () => {
    const query = gql`
      {
        artworksByImageConnection(
          s3Key: "uploads/query.jpg"
          s3Bucket: "artsy-media"
          first: 10
        ) {
          totalCount
          edges {
            node {
              slug
            }
          }
        }
      }
    `

    await runQuery(query, context)

    expect(mockArtworksByImageLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        image: {
          s3_key: "uploads/query.jpg",
          s3_bucket: "artsy-media",
        },
        total_count: true,
        page: 1,
        size: 10,
      })
    )
  })

  it("returns a connection of artworks", async () => {
    const query = gql`
      {
        artworksByImageConnection(
          s3Key: "uploads/query.jpg"
          s3Bucket: "artsy-media"
          first: 10
        ) {
          totalCount
          edges {
            node {
              slug
            }
          }
        }
      }
    `

    const { artworksByImageConnection } = await runQuery(query, context)

    expect(artworksByImageConnection.totalCount).toEqual(2)
    expect(artworksByImageConnection.edges).toEqual([
      { node: { slug: "artwork-1" } },
      { node: { slug: "artwork-2" } },
    ])
  })

  it("returns an empty connection when there are no hits", async () => {
    mockArtworksByImageLoader.mockResolvedValueOnce({
      body: { hits: [] },
      headers: { "x-total-count": "0" },
    })

    const query = gql`
      {
        artworksByImageConnection(
          s3Key: "uploads/query.jpg"
          s3Bucket: "artsy-media"
          first: 10
        ) {
          totalCount
          edges {
            node {
              slug
            }
          }
        }
      }
    `

    const { artworksByImageConnection } = await runQuery(query, context)

    expect(artworksByImageConnection.totalCount).toEqual(0)
    expect(artworksByImageConnection.edges).toEqual([])
  })

  it("requires both s3Key and s3Bucket", async () => {
    const query = gql`
      {
        artworksByImageConnection(s3Key: "uploads/query.jpg", first: 10) {
          edges {
            node {
              slug
            }
          }
        }
      }
    `

    await expect(runQuery(query, context)).rejects.toThrow(/s3Bucket/)
  })
})
