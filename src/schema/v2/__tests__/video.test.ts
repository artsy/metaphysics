import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("Video type", () => {
  describe("as a root field", () => {
    it("fetches a video by ID", async () => {
      const query = gql`
        {
          video(id: "example-video-id") {
            id
            internalID
            playerUrl
            height
            width
            title
            description
          }
        }
      `

      const context = {
        videoLoader: () => {
          return Promise.resolve({
            _id: "example-video-id",
            id: "example-video-id",
            player_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            height: 720,
            width: 1280,
            title: "Example Video",
            description: "This is an example video",
          })
        },
      }

      const { video } = await runQuery(query, context)

      expect(video).toEqual({
        id: "VmlkZW86ZXhhbXBsZS12aWRlby1pZA==", // Base64 encoding of `Video:example-video-id`
        internalID: "example-video-id",
        playerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        height: 720,
        width: 1280,
        title: "Example Video",
        description: "This is an example video",
      })
    })
  })

  describe("as an Artwork field", () => {
    it("resolves from artwork's external_video_id", async () => {
      const query = gql`
        {
          artwork(id: "example-artwork-id") {
            internalID
            figures {
              ... on Video {
                id
                playerUrl
                width
                height
              }
            }
          }
        }
      `

      const context: Partial<ResolverContext> = {
        artworkLoader: () => {
          return Promise.resolve({
            _id: "example-artwork-id",
            images: [],
            external_video_id:
              "https://player.vimeo.com/video/4242?h=4242&width=400&height=300",
            set_video_as_cover: false,
          })
        },
      }

      const { artwork } = await runQuery(query, context)

      expect(artwork).toEqual({
        internalID: "example-artwork-id",
        figures: [
          {
            id: "4740eaf7-31c7-5aee-b1d3-1a5503d71cfc", // custom uuid logic
            playerUrl:
              "https://player.vimeo.com/video/4242?h=4242&width=400&height=300",
            width: 400,
            height: 300,
          },
        ],
      })
    })
  })
})
