import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("videosConnection", () => {
  it("fetches videos with pagination", async () => {
    const videosLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [
          {
            _id: "video-1",
            title: "First Video",
            description: "Description of first video",
            player_embed_url: "https://example.com/video1",
            height: 720,
            width: 1280,
          },
          {
            _id: "video-2",
            title: "Second Video",
            description: "Description of second video",
            player_embed_url: "https://example.com/video2",
            height: 1080,
            width: 1920,
          },
        ],
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        videosConnection(first: 5) {
          totalCount
          edges {
            node {
              internalID
              title
              description
              playerUrl
              height
              width
            }
          }
        }
      }
    `
    const context = { videosLoader }
    const { videosConnection } = await runAuthenticatedQuery(query, context)

    expect(videosLoader).toHaveBeenCalledWith({
      page: 1,
      size: 5,
      total_count: true,
      term: undefined,
      sort: "-updated_at",
    })

    expect(videosConnection).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "node": {
              "description": "Description of first video",
              "height": 720,
              "internalID": "video-1",
              "playerUrl": "https://example.com/video1",
              "title": "First Video",
              "width": 1280,
            },
          },
          {
            "node": {
              "description": "Description of second video",
              "height": 1080,
              "internalID": "video-2",
              "playerUrl": "https://example.com/video2",
              "title": "Second Video",
              "width": 1920,
            },
          },
        ],
        "totalCount": 2,
      }
    `)
  })

  it("filters videos by search term", async () => {
    const videosLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [
          {
            _id: "video-1",
            title: "Artist Interview",
            description: "Interview with the artist",
            player_embed_url: "https://example.com/interview",
            height: 720,
            width: 1280,
          },
        ],
        headers: { "x-total-count": "1" },
      })
    )

    const query = gql`
      {
        videosConnection(term: "interview", first: 10) {
          totalCount
          edges {
            node {
              internalID
              title
            }
          }
        }
      }
    `
    const context = { videosLoader }
    const { videosConnection } = await runAuthenticatedQuery(query, context)

    expect(videosLoader).toHaveBeenCalledWith({
      term: "interview",
      page: 1,
      size: 10,
      total_count: true,
      sort: "-updated_at",
    })

    expect(videosConnection).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "node": {
              "internalID": "video-1",
              "title": "Artist Interview",
            },
          },
        ],
        "totalCount": 1,
      }
    `)
  })

  it("throws an error when not authenticated", async () => {
    const query = gql`
      {
        videosConnection(first: 5) {
          edges {
            node {
              title
            }
          }
        }
      }
    `

    await expect(
      runAuthenticatedQuery(query, { videosLoader: undefined })
    ).rejects.toThrow("You need to be logged in to perform this action")
  })
})
