import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("instagramPost", () => {
  describe("single post query", () => {
    const query = `
      {
        instagramPost(id: "post-1") {
          internalID
          instagramAccountId
          partnerId
          artworkId
          instagramMediaId
          permalink
          caption
          status
        }
      }
    `

    const mockGravityResponse = {
      id: "post-1",
      _id: "post-1",
      instagram_account_id: "ig-account-1",
      partner_id: "partner-1",
      artwork_id: "artwork-1",
      instagram_media_id: "media-123",
      permalink: "https://www.instagram.com/p/ABC123/",
      caption: "Beautiful artwork",
      status: "published",
      published_at: "2026-03-10T12:00:00Z",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        instagramPostLoader: jest.fn().mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes the id to the loader", async () => {
      await runAuthenticatedQuery(query, context)

      expect(context.instagramPostLoader as jest.Mock).toHaveBeenCalledWith(
        "post-1"
      )
    })

    it("returns post fields", async () => {
      const result = await runAuthenticatedQuery(query, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "instagramPost": {
            "artworkId": "artwork-1",
            "caption": "Beautiful artwork",
            "instagramAccountId": "ig-account-1",
            "instagramMediaId": "media-123",
            "internalID": "post-1",
            "partnerId": "partner-1",
            "permalink": "https://www.instagram.com/p/ABC123/",
            "status": "PUBLISHED",
          },
        }
      `)
    })
  })

  describe("posts connection query", () => {
    const query = `
      {
        instagramPostsConnection(partnerId: "partner-1", first: 1) {
          totalCount
          edges {
            node {
              internalID
              caption
              status
            }
          }
        }
      }
    `

    const mockGravityResponse = {
      body: [
        {
          id: "post-1",
          _id: "post-1",
          caption: "Beautiful artwork",
          status: "published",
          partner_id: "partner-1",
        },
      ],
      headers: { "x-total-count": "1" },
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        instagramPostsLoader: jest.fn().mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct params to loader", async () => {
      await runAuthenticatedQuery(query, context)

      expect(context.instagramPostsLoader as jest.Mock).toHaveBeenCalledWith({
        partner_id: "partner-1",
        total_count: true,
        size: 1,
        offset: 0,
      })
    })

    it("returns connection of posts", async () => {
      const result = await runAuthenticatedQuery(query, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "instagramPostsConnection": {
            "edges": [
              {
                "node": {
                  "caption": "Beautiful artwork",
                  "internalID": "post-1",
                  "status": "PUBLISHED",
                },
              },
            ],
            "totalCount": 1,
          },
        }
      `)
    })
  })
})
