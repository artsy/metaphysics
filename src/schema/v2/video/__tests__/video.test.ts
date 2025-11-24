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

    it("returns aspect ratio from Gravity", async () => {
      const query = gql`
        {
          video(id: "example-video-id") {
            width
            height
            aspectRatio
          }
        }
      `

      const context = {
        videoLoader: () => {
          return Promise.resolve({
            _id: "example-video-id",
            player_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            height: 720,
            width: 1280,
            title: "Example Video",
            aspect_ratio: 1.7777777778,
          })
        },
      }

      const { video } = await runQuery(query, context)

      expect(video).toEqual({
        width: 1280,
        height: 720,
        aspectRatio: 1.7777777778, // 16:9
      })
    })

    it("returns null aspect ratio when not provided by Gravity", async () => {
      const query = gql`
        {
          video(id: "example-video-id") {
            aspectRatio
          }
        }
      `

      const context = {
        videoLoader: () => {
          return Promise.resolve({
            _id: "example-video-id",
            player_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            height: 720,
            width: 1280,
            title: "Example Video",
            aspect_ratio: null,
          })
        },
      }

      const { video } = await runQuery(query, context)

      expect(video.aspectRatio).toBeNull()
    })

    it("returns an embed iframe for YouTube videos", async () => {
      const query = gql`
        {
          video(id: "example-video-id") {
            embed(autoPlay: false)
          }
        }
      `

      const context = {
        videoLoader: () => {
          return Promise.resolve({
            _id: "example-video-id",
            player_embed_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            height: 720,
            width: 1280,
            title: "Example Video",
          })
        },
      }

      const { video } = await runQuery(query, context)

      expect(video.embed).toContain("<iframe")
      expect(video.embed).toContain(
        'src="https://www.youtube.com/embed/dQw4w9WgXcQ'
      )
      expect(video.embed).toContain("autoplay=0")
    })

    it("returns an embed iframe with autoplay enabled", async () => {
      const query = gql`
        {
          video(id: "example-video-id") {
            embed(autoPlay: true)
          }
        }
      `

      const context = {
        videoLoader: () => {
          return Promise.resolve({
            _id: "example-video-id",
            player_embed_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            height: 720,
            width: 1280,
            title: "Example Video",
          })
        },
      }

      const { video } = await runQuery(query, context)

      expect(video.embed).toContain("autoplay=1")
    })

    it("returns an embed iframe for Vimeo videos", async () => {
      const query = gql`
        {
          video(id: "example-video-id") {
            embed
          }
        }
      `

      const context = {
        videoLoader: () => {
          return Promise.resolve({
            _id: "example-video-id",
            player_embed_url: "https://vimeo.com/123456789",
            height: 720,
            width: 1280,
            title: "Vimeo Video",
          })
        },
      }

      const { video } = await runQuery(query, context)

      expect(video.embed).toContain("<iframe")
      expect(video.embed).toContain(
        'src="https://player.vimeo.com/video/123456789'
      )
    })

    it("returns null for non-supported video providers", async () => {
      const query = gql`
        {
          video(id: "example-video-id") {
            embed
          }
        }
      `

      const context = {
        videoLoader: () => {
          return Promise.resolve({
            _id: "example-video-id",
            player_embed_url: "https://example.com/video.mp4",
            height: 720,
            width: 1280,
            title: "Example Video",
          })
        },
      }

      const { video } = await runQuery(query, context)

      expect(video.embed).toBeNull()
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
