import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("artist.instagramMedia", () => {
  let media
  let context

  beforeEach(() => {
    media = [
      {
        id: "post-1",
        external_post_id: "ig-1",
        permalink: "https://instagram.com/p/1",
        caption: "one",
        published_at: "2026-09-02T12:00:00+00:00",
        image: {
          id: "image-1",
          gemini_token: "token-1",
          gemini_token_updated_at: "2026-09-02T12:00:01+00:00",
          image_url: "https://d7hftxdivxxvm.cloudfront.net/abc/:version.jpg",
          image_urls: {
            large: "https://d7hftxdivxxvm.cloudfront.net/abc/large.jpg",
          },
          image_versions: ["large"],
          original_width: 1080,
          original_height: 1350,
          aspect_ratio: 0.8,
        },
      },
      {
        id: "post-2",
        external_post_id: "ig-2",
        permalink: "https://instagram.com/p/2",
        caption: "two",
        published_at: "2026-09-01T12:00:00+00:00",
        image: {
          id: "image-2",
          gemini_token: "token-2",
          gemini_token_updated_at: "2026-09-01T12:00:01+00:00",
          image_url: "https://d7hftxdivxxvm.cloudfront.net/def/:version.jpg",
          image_urls: {
            large: "https://d7hftxdivxxvm.cloudfront.net/def/large.jpg",
          },
          image_versions: ["large"],
          original_width: 1080,
          original_height: 1080,
          aspect_ratio: 1,
        },
      },
    ]

    context = {
      artistLoader: () => Promise.resolve({ id: "artistID", _id: "artistID" }),
      artistInstagramMediaLoader: () => Promise.resolve(media),
    }
  })

  it("returns instagram media with an image, permalink and caption", async () => {
    const query = gql`
      {
        artist(id: "artistID") {
          instagramMedia {
            internalID
            permalink
            caption
            image {
              url(version: ["large"])
              aspectRatio
              width
              height
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      artist: {
        instagramMedia: [
          {
            internalID: "post-1",
            permalink: "https://instagram.com/p/1",
            caption: "one",
            image: {
              url: "https://d7hftxdivxxvm.cloudfront.net/abc/large.jpg",
              aspectRatio: 0.8,
              width: 1080,
              height: 1350,
            },
          },
          {
            internalID: "post-2",
            permalink: "https://instagram.com/p/2",
            caption: "two",
            image: {
              url: "https://d7hftxdivxxvm.cloudfront.net/def/large.jpg",
              aspectRatio: 1,
              width: 1080,
              height: 1080,
            },
          },
        ],
      },
    })
  })

  it("serves the provider url until the image has been processed", async () => {
    media = [
      {
        id: "post-1",
        external_post_id: "ig-1",
        permalink: "https://instagram.com/p/1",
        caption: "one",
        published_at: "2026-09-02T12:00:00+00:00",
        image: {
          id: null,
          gemini_token: null,
          gemini_token_updated_at: null,
          image_url: "https://scontent.cdninstagram.com/1.jpg",
          image_urls: null,
          image_versions: [],
          original_width: null,
          original_height: null,
          aspect_ratio: null,
        },
      },
    ]

    const query = gql`
      {
        artist(id: "artistID") {
          instagramMedia {
            image {
              url(version: ["large"])
              imageVersions
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      artist: {
        instagramMedia: [
          {
            image: {
              url: "https://scontent.cdninstagram.com/1.jpg",
              imageVersions: [],
            },
          },
        ],
      },
    })
  })

  it("reports a processed image as no longer processing", async () => {
    media[0].image.gemini_token_updated_at = new Date().toISOString()

    const query = gql`
      {
        artist(id: "artistID") {
          instagramMedia {
            image {
              isProcessing
              processingFailed
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data.artist.instagramMedia[0].image).toEqual({
      isProcessing: false,
      processingFailed: false,
    })
  })

  it("reports an unprocessed image as processing while within the grace period", async () => {
    media[0].image.gemini_token_updated_at = new Date().toISOString()
    media[0].image.image_urls = null
    media[0].image.image_versions = []

    const query = gql`
      {
        artist(id: "artistID") {
          instagramMedia {
            image {
              isProcessing
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data.artist.instagramMedia[0].image).toEqual({ isProcessing: true })
  })

  it("returns no image when the post has neither a processed nor a provider url", async () => {
    media = [
      {
        id: "post-1",
        external_post_id: "ig-1",
        permalink: "https://instagram.com/p/1",
        caption: "one",
        published_at: "2026-09-02T12:00:00+00:00",
        image: null,
      },
    ]

    const query = gql`
      {
        artist(id: "artistID") {
          instagramMedia {
            image {
              url
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      artist: { instagramMedia: [{ image: null }] },
    })
  })

  it("limits the number of items with `first`", async () => {
    const query = gql`
      {
        artist(id: "artistID") {
          instagramMedia(first: 1) {
            internalID
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      artist: {
        instagramMedia: [{ internalID: "post-1" }],
      },
    })
  })
})
