import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createImageMutation", () => {
  const mockCreateImageLoader = jest.fn()

  const context = {
    createImageLoader: mockCreateImageLoader,
  }

  afterEach(() => {
    mockCreateImageLoader.mockReset()
  })

  it("creates an image and returns its details", async () => {
    mockCreateImageLoader.mockResolvedValue({
      id: "abc123",
      original_height: 100,
      original_width: 200,
      image_url: "https://bucket.s3.amazonaws.com/path/to/image.jpg",
      image_urls: { normalized: "https://processed.example.com/image.jpg" },
      image_versions: ["normalized"],
    })

    const mutation = gql`
      mutation {
        createImage(
          input: {
            src: "https://bucket.s3.amazonaws.com/path/to/image.jpg"
            templateKey: "large_rectangle"
          }
        ) {
          image {
            internalID
            height
            width
            imageURLs {
              normalized
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockCreateImageLoader).toHaveBeenCalledWith({
      src: "https://bucket.s3.amazonaws.com/path/to/image.jpg",
      template_key: "large_rectangle",
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "createImage": {
          "image": {
            "height": 100,
            "imageURLs": {
              "normalized": "https://processed.example.com/image.jpg",
            },
            "internalID": "abc123",
            "width": 200,
          },
        },
      }
    `)
  })

  it("returns a formatted error when Gravity returns an error", async () => {
    mockCreateImageLoader.mockRejectedValue({
      body: { error: "Image is too large" },
      statusCode: 400,
    })

    const mutation = gql`
      mutation {
        createImage(
          input: {
            src: "https://bucket.s3.amazonaws.com/path/to/image.jpg"
            templateKey: "large_rectangle"
          }
        ) {
          image {
            internalID
          }
        }
      }
    `

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "Image is too large"
    )
  })

  it("throws an error if user is not authenticated", async () => {
    const unauthenticatedContext = {
      createImageLoader: undefined,
    }

    const mutation = gql`
      mutation {
        createImage(
          input: {
            src: "https://bucket.s3.amazonaws.com/path/to/image.jpg"
            templateKey: "large_rectangle"
          }
        ) {
          image {
            internalID
          }
        }
      }
    `

    await expect(
      runAuthenticatedQuery(mutation, unauthenticatedContext)
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
