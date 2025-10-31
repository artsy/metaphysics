import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("Video type", () => {
  it("fetches a video by ID", async () => {
    const query = gql`
      {
        video(id: "example-video-id") {
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
      playerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      height: 720,
      width: 1280,
      title: "Example Video",
      description: "This is an example video",
    })
  })

  it("resolves playerUrl from player_embed_url when playerUrl is not present", async () => {
    const query = gql`
      {
        video(id: "example-video-id") {
          playerUrl
        }
      }
    `

    const context = {
      videoLoader: () => {
        return Promise.resolve({
          id: "example-video-id",
          player_embed_url: "https://vimeo.com/player/123456",
          height: 480,
          width: 640,
        })
      },
    }

    const { video } = await runQuery(query, context)

    expect(video.playerUrl).toEqual("https://vimeo.com/player/123456")
  })
})
