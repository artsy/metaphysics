import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.notification", () => {
  const meLoader = jest.fn(async () => ({ id: "some-user-id" }))

  it("returns a notification", async () => {
    const query = gql`
      {
        me {
          notification(id: "user-notification-id") {
            internalID
            headline
            message
          }
        }
      }
    `
    const meNotificationLoader = jest.fn(async () => ({
      id: "user-notification-id",
      headline: "6 works added by Gerhard Richter",
      message: "6 works added",
    }))

    const context: Partial<ResolverContext> = {
      meNotificationLoader,
      meLoader,
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(meLoader).toHaveBeenCalled()
    expect(meNotificationLoader).toHaveBeenCalledWith("user-notification-id")

    expect(data).toMatchInlineSnapshot(`
      {
        "me": {
          "notification": {
            "headline": "6 works added by Gerhard Richter",
            "internalID": "user-notification-id",
            "message": "6 works added",
          },
        },
      }
    `)
  })

  describe("previewImages", () => {
    const query = gql`
      {
        me {
          notification(id: "test-id") {
            notificationType
            previewImages(size: 5) {
              imageURL
            }
          }
        }
      }
    `
    it('returns "ViewingRoomPublishedActivity" preview images', async () => {
      const context: Partial<ResolverContext> = {
        meLoader,
        meNotificationLoader: jest.fn(async () => ({
          activity_type: "ViewingRoomPublishedActivity",
          object_ids: ["viewing-room-id"],
        })),
        viewingRoomLoader: jest.fn(async () => ({
          image_versions: ["large"],
          image_url: "http://test.com",
        })),
      }

      const data = await runAuthenticatedQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        {
          "me": {
            "notification": {
              "notificationType": "VIEWING_ROOM_PUBLISHED",
              "previewImages": [
                {
                  "imageURL": "http://test.com",
                },
              ],
            },
          },
        }
      `)
    })

    it('returns "ArticleFeaturedArtistActivity" preview images', async () => {
      const context: Partial<ResolverContext> = {
        meLoader,
        meNotificationLoader: jest.fn(async () => ({
          activity_type: "ArticleFeaturedArtistActivity",
          actor_ids: ["article-id"],
        })),
        articleLoader: jest.fn(async () => ({
          thumbnail_image: {
            image_url: "http://test.com",
          },
        })),
      }

      const data = await runAuthenticatedQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        {
          "me": {
            "notification": {
              "notificationType": "ARTICLE_FEATURED_ARTIST",
              "previewImages": [
                {
                  "imageURL": "http://test.com",
                },
              ],
            },
          },
        }
      `)
    })

    it('returns "PartnerShowOpenedActivity" preview images', async () => {
      const context: Partial<ResolverContext> = {
        meLoader,
        meNotificationLoader: jest.fn(async () => ({
          activity_type: "PartnerShowOpenedActivity",
          object_ids: ["show-id"],
        })),
        showsLoader: jest.fn(async () => [
          {
            image_versions: ["large"],
            image_url: "http://test.com",
          },
        ]),
      }

      const data = await runAuthenticatedQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        {
          "me": {
            "notification": {
              "notificationType": "PARTNER_SHOW_OPENED",
              "previewImages": [
                {
                  "imageURL": "http://test.com",
                },
              ],
            },
          },
        }
      `)
    })

    it("returns default preview images from artworksConnection", async () => {
      const context: Partial<ResolverContext> = {
        meLoader,
        meNotificationLoader: jest.fn(async () => ({
          activity_type: "ArtworkPublishedActivity",
          object_ids: ["artwork-id"],
        })),
        artworksLoader: jest.fn(async () => [
          {
            images: [
              {
                image_url: "http://test.com",
              },
            ],
          },
        ]),
      }

      const data = await runAuthenticatedQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        {
          "me": {
            "notification": {
              "notificationType": "ARTWORK_PUBLISHED",
              "previewImages": [
                {
                  "imageURL": "http://test.com",
                },
              ],
            },
          },
        }
      `)
    })
  })
})
