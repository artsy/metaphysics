import fetch from "node-fetch"
import { runQuery } from "schema/v2/test/utils"

jest.mock("node-fetch")

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

const query = `{
  originalImageUrl(ownerType: ARTWORK, ownerId: "some-artwork", imageId: "abc123") {
    ... on OriginalImageUrlSuccess {
      imageUrl
    }
    ... on GravityMutationError {
      message
      statusCode
    }
  }
}`

describe("originalImageUrl", () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it("returns the S3 URL on a successful redirect for an artwork", async () => {
    mockFetch.mockResolvedValue({
      status: 302,
      headers: {
        get: (header: string) =>
          header === "location"
            ? "https://s3.amazonaws.com/artsy-media/original.jpg"
            : null,
      },
    } as any)

    const data = await runQuery(query, { accessToken: "user-token" })

    expect(data.originalImageUrl).toEqual({
      imageUrl: "https://s3.amazonaws.com/artsy-media/original.jpg",
    })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/artwork/some-artwork/image/abc123/original.jpg"
      ),
      expect.objectContaining({
        headers: expect.objectContaining({ "X-ACCESS-TOKEN": "user-token" }),
        redirect: "manual",
      })
    )
  })

  it("returns the S3 URL for a show install shot", async () => {
    mockFetch.mockResolvedValue({
      status: 302,
      headers: {
        get: (header: string) =>
          header === "location"
            ? "https://s3.amazonaws.com/artsy-media/install.jpg"
            : null,
      },
    } as any)

    const showQuery = `{
      originalImageUrl(ownerType: SHOW, ownerId: "some-show", imageId: "def456") {
        ... on OriginalImageUrlSuccess {
          imageUrl
        }
      }
    }`

    const data = await runQuery(showQuery, { accessToken: "user-token" })

    expect(data.originalImageUrl).toEqual({
      imageUrl: "https://s3.amazonaws.com/artsy-media/install.jpg",
    })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/partner_show/some-show/image/def456/original.jpg"
      ),
      expect.objectContaining({ redirect: "manual" })
    )
  })

  it("returns an error with statusCode 404 when the image is not found", async () => {
    mockFetch.mockResolvedValue({
      status: 404,
      headers: { get: () => null },
    } as any)

    const data = await runQuery(query, { accessToken: "user-token" })

    expect(data.originalImageUrl).toEqual({
      message: "Image not found",
      statusCode: 404,
    })
  })

  it("returns an error with statusCode 401 when unauthorized", async () => {
    mockFetch.mockResolvedValue({
      status: 401,
      headers: { get: () => null },
    } as any)

    const data = await runQuery(query, { accessToken: "bad-token" })

    expect(data.originalImageUrl).toEqual({
      message: "Unauthorized",
      statusCode: 401,
    })
  })

  it("returns an error when the fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("network error"))

    const data = await runQuery(query, { accessToken: "user-token" })

    expect(data.originalImageUrl).toEqual({
      message: "network error",
      statusCode: null,
    })
  })
})
