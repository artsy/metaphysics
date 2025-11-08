import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createVideoMutation", () => {
  const mutation = gql`
    mutation {
      createVideo(
        input: {
          title: "Example Video"
          description: "This is a test video"
          playerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
          width: 1280
          height: 720
        }
      ) {
        videoOrError {
          __typename
          ... on CreateVideoSuccess {
            video {
              internalID
              title
              playerUrl
              width
              height
            }
          }
          ... on CreateVideoFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("calls the loader with correct params", async () => {
    const createdVideo = {
      _id: "video-id-123",
      title: "Example Video",
      description: "This is a test video",
      player_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      width: 1280,
      height: 720,
    }
    const createVideoLoader = jest.fn(() => Promise.resolve(createdVideo))
    const context = { createVideoLoader }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(createVideoLoader).toHaveBeenCalledWith({
      title: "Example Video",
      description: "This is a test video",
      player_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      width: 1280,
      height: 720,
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "createVideo": {
          "videoOrError": {
            "__typename": "CreateVideoSuccess",
            "video": {
              "height": 720,
              "internalID": "video-id-123",
              "playerUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
              "title": "Example Video",
              "width": 1280,
            },
          },
        },
      }
    `)
  })

  it("returns gravity errors", async () => {
    const context = {
      createVideoLoader: () =>
        Promise.reject(
          new HTTPError(`Server Error`, 500, `{"message":"Error from Gravity"}`)
        ),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "createVideo": {
          "videoOrError": {
            "__typename": "CreateVideoFailure",
            "mutationError": {
              "message": "Error from Gravity",
            },
          },
        },
      }
    `)
  })
})
