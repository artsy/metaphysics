import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateVideoMutation", () => {
  const mutation = gql`
    mutation {
      updateVideo(
        input: {
          id: "video-id-123"
          title: "Updated Title"
          description: "Updated description"
          playerUrl: "https://updated.url"
          width: 400
          height: 300
        }
      ) {
        videoOrError {
          __typename
          ... on UpdateVideoSuccess {
            video {
              internalID
              title
              description
              playerUrl
              width
              height
            }
          }
          ... on UpdateVideoFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("calls the loader with correct params", async () => {
    const updatedVideo = {
      _id: "video-id-123",
      title: "Updated Title",
      player_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      width: 1280,
      height: 720,
    }
    const mockUpdateVideoLoader = jest.fn(() => Promise.resolve(updatedVideo))
    const context = { updateVideoLoader: mockUpdateVideoLoader }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockUpdateVideoLoader).toHaveBeenCalledWith("video-id-123", {
      title: "Updated Title",
      description: "Updated description",
      player_embed_url: "https://updated.url",
      width: 400,
      height: 300,
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "updateVideo": {
          "videoOrError": {
            "__typename": "UpdateVideoSuccess",
            "video": {
              "description": null,
              "height": 720,
              "internalID": "video-id-123",
              "playerUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
              "title": "Updated Title",
              "width": 1280,
            },
          },
        },
      }
    `)
  })

  it("returns gravity errors", async () => {
    const context = {
      updateVideoLoader: () =>
        Promise.reject(
          new HTTPError(`Server Error`, 500, `{"message":"Error from Gravity"}`)
        ),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "updateVideo": {
          "videoOrError": {
            "__typename": "UpdateVideoFailure",
            "mutationError": {
              "message": "Error from Gravity",
            },
          },
        },
      }
    `)
  })
})
