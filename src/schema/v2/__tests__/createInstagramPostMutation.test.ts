import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    createInstagramPost(input: {
      instagramAccountId: "ig-account-1"
      artworkId: "artwork-1"
      caption: "Beautiful artwork"
      collaborators: ["collab1", "collab2"]
    }) {
      instagramPostOrError {
        __typename
        ... on CreateInstagramPostSuccess {
          instagramPost {
            internalID
            caption
            status
            instagramMediaId
            permalink
          }
        }
        ... on CreateInstagramPostFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

const mutationWithSlides = `
  mutation {
    createInstagramPost(input: {
      instagramAccountId: "ig-account-1"
      slides: [
        { artworkId: "artwork-1", imageUrl: "https://example.com/custom.jpg" }
        { artworkId: "artwork-2" }
      ]
      caption: "Beautiful artwork"
      collaborators: ["collab1", "collab2"]
    }) {
      instagramPostOrError {
        __typename
        ... on CreateInstagramPostSuccess {
          instagramPost {
            internalID
            artworkIds
            caption
            status
          }
        }
        ... on CreateInstagramPostFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

const mockGravityResponse = {
  id: "post-1",
  _id: "post-1",
  instagram_account_id: "ig-account-1",
  partner_id: "partner-1",
  artwork_id: "artwork-1",
  artwork_ids: ["artwork-1"],
  instagram_media_id: "media-456",
  permalink: "https://www.instagram.com/p/DVgtwjtDPuF/",
  caption: "Beautiful artwork",
  status: "published",
  published_at: "2026-03-10T12:00:00Z",
}

const mockGravityResponseWithSlides = {
  id: "post-1",
  _id: "post-1",
  instagram_account_id: "ig-account-1",
  partner_id: "partner-1",
  artwork_id: "artwork-1",
  artwork_ids: ["artwork-1", "artwork-2"],
  instagram_media_id: "media-456",
  permalink: "https://www.instagram.com/p/DVgtwjtDPuF/",
  caption: "Beautiful artwork",
  status: "published",
  published_at: "2026-03-10T12:00:00Z",
}

describe("createInstagramPost", () => {
  describe("on success", () => {
    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        createInstagramPostLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.createInstagramPostLoader as jest.Mock
      ).toHaveBeenCalledWith({
        instagram_account_id: "ig-account-1",
        artwork_id: "artwork-1",
        caption: "Beautiful artwork",
        collaborators: ["collab1", "collab2"],
      })
    })

    it("returns the created post on success", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "createInstagramPost": {
            "instagramPostOrError": {
              "__typename": "CreateInstagramPostSuccess",
              "instagramPost": {
                "caption": "Beautiful artwork",
                "instagramMediaId": "media-456",
                "internalID": "post-1",
                "permalink": "https://www.instagram.com/p/DVgtwjtDPuF/",
                "status": "PUBLISHED",
              },
            },
          },
        }
      `)
    })
  })

  describe("with slides", () => {
    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        createInstagramPostLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponseWithSlides),
      }
    })

    it("passes slides to Gravity", async () => {
      await runAuthenticatedQuery(mutationWithSlides, context)

      expect(
        context.createInstagramPostLoader as jest.Mock
      ).toHaveBeenCalledWith({
        instagram_account_id: "ig-account-1",
        slides: [
          {
            artwork_id: "artwork-1",
            image_url: "https://example.com/custom.jpg",
          },
          { artwork_id: "artwork-2", image_url: undefined },
        ],
        caption: "Beautiful artwork",
        collaborators: ["collab1", "collab2"],
      })
    })

    it("returns artworkIds on success", async () => {
      const result = await runAuthenticatedQuery(mutationWithSlides, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "createInstagramPost": {
            "instagramPostOrError": {
              "__typename": "CreateInstagramPostSuccess",
              "instagramPost": {
                "artworkIds": [
                  "artwork-1",
                  "artwork-2",
                ],
                "caption": "Beautiful artwork",
                "internalID": "post-1",
                "status": "PUBLISHED",
              },
            },
          },
        }
      `)
    })
  })

  describe("without optional fields", () => {
    const mutationWithoutOptionals = `
      mutation {
        createInstagramPost(input: {
          instagramAccountId: "ig-account-1"
          artworkId: "artwork-1"
        }) {
          instagramPostOrError {
            __typename
            ... on CreateInstagramPostSuccess {
              instagramPost {
                internalID
                caption
              }
            }
          }
        }
      }
    `

    it("passes undefined for optional fields", async () => {
      const context: Partial<ResolverContext> = {
        createInstagramPostLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }

      await runAuthenticatedQuery(mutationWithoutOptionals, context)

      expect(
        context.createInstagramPostLoader as jest.Mock
      ).toHaveBeenCalledWith({
        instagram_account_id: "ig-account-1",
        artwork_id: "artwork-1",
        caption: undefined,
        collaborators: undefined,
      })
    })
  })

  it("throws when neither slides nor artworkId is provided", async () => {
    const mutationWithoutArtwork = `
      mutation {
        createInstagramPost(input: {
          instagramAccountId: "ig-account-1"
          caption: "Beautiful artwork"
        }) {
          instagramPostOrError {
            __typename
          }
        }
      }
    `

    const context: Partial<ResolverContext> = {
      createInstagramPostLoader: jest.fn(),
    }

    await expect(
      runAuthenticatedQuery(mutationWithoutArtwork, context)
    ).rejects.toThrow("Either slides or artworkId must be provided")
  })

  it("throws when not authenticated", async () => {
    await expect(runQuery(mutation)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("returns failure when Gravity returns an error", async () => {
    const gravityResponseBody = {
      detail: "Account is not active",
      message: "Account is not active.",
      type: "param_error",
    }
    const error = new HTTPError(
      "http://artsy.net - {}",
      400,
      gravityResponseBody
    )
    const context: Partial<ResolverContext> = {
      createInstagramPostLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "createInstagramPost": {
          "instagramPostOrError": {
            "__typename": "CreateInstagramPostFailure",
            "mutationError": {
              "message": "Account is not active.",
            },
          },
        },
      }
    `)
  })
})
