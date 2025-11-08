import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deleteVideoMutation", () => {
  const mutation = gql`
    mutation {
      deleteVideo(input: { id: "video-id-123" }) {
        videoOrError {
          __typename
          ... on DeleteVideoSuccess {
            video {
              internalID
              title
              playerUrl
              width
              height
            }
          }
          ... on DeleteVideoFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("calls the loader with correct params", async () => {
    const deletedVideo = {
      _id: "video-id-123",
      title: "Example Video",
      player_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      width: 1280,
      height: 720,
    }
    const deleteVideoLoader = jest.fn(() => Promise.resolve(deletedVideo))
    const context = { deleteVideoLoader }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.deleteVideoLoader).toHaveBeenCalledWith("video-id-123")

    expect(result).toMatchInlineSnapshot(`
      {
        "deleteVideo": {
          "videoOrError": {
            "__typename": "DeleteVideoSuccess",
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
      deleteVideoLoader: () =>
        Promise.reject(
          new HTTPError(`Server Error`, 500, `{"message":"Error from Gravity"}`)
        ),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "deleteVideo": {
          "videoOrError": {
            "__typename": "DeleteVideoFailure",
            "mutationError": {
              "message": "Error from Gravity",
            },
          },
        },
      }
    `)
  })
})
