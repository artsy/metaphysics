import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("artist.instagramMedia", () => {
  let media
  let context

  beforeEach(() => {
    media = [
      {
        id: "1",
        media_type: "IMAGE",
        media_url: "https://example.com/1.jpg",
        permalink: "https://instagram.com/p/1",
        caption: "one",
      },
      {
        id: "2",
        media_type: "IMAGE",
        media_url: "https://example.com/2.jpg",
        permalink: "https://instagram.com/p/2",
        caption: "two",
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
              url
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
            internalID: "1",
            permalink: "https://instagram.com/p/1",
            caption: "one",
            image: { url: "https://example.com/1.jpg" },
          },
          {
            internalID: "2",
            permalink: "https://instagram.com/p/2",
            caption: "two",
            image: { url: "https://example.com/2.jpg" },
          },
        ],
      },
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
        instagramMedia: [{ internalID: "1" }],
      },
    })
  })
})
