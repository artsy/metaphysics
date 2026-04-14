import fetch from "node-fetch"
import { runQuery } from "schema/v2/test/utils"

jest.mock("node-fetch")

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe("originalImageUrl", () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      headers: {
        get: (header: string) =>
          header === "location"
            ? "https://s3.amazonaws.com/artsy-media/original.jpg"
            : null,
      },
    } as any)
  })

  it("follows the Gravity redirect for an artwork image and returns the S3 URL", async () => {
    const query = `{
      originalImageUrl(ownerType: ARTWORK, ownerId: "some-artwork", imageId: "abc123")
    }`

    const data = await runQuery(query, { accessToken: "user-token" })

    expect(data.originalImageUrl).toBe(
      "https://s3.amazonaws.com/artsy-media/original.jpg"
    )
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

  it("follows the Gravity redirect for a show install shot and returns the S3 URL", async () => {
    const query = `{
      originalImageUrl(ownerType: SHOW, ownerId: "some-show", imageId: "def456")
    }`

    const data = await runQuery(query, { accessToken: "user-token" })

    expect(data.originalImageUrl).toBe(
      "https://s3.amazonaws.com/artsy-media/original.jpg"
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/partner_show/some-show/image/def456/original.jpg"
      ),
      expect.objectContaining({ redirect: "manual" })
    )
  })

  it("returns null when there is no location header in the response", async () => {
    mockFetch.mockResolvedValue({
      headers: { get: () => null },
    } as any)

    const query = `{
      originalImageUrl(ownerType: ARTWORK, ownerId: "some-artwork", imageId: "abc123")
    }`

    const data = await runQuery(query, { accessToken: "user-token" })

    expect(data.originalImageUrl).toBeNull()
  })

  it("returns null when the fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("network error"))

    const query = `{
      originalImageUrl(ownerType: SHOW, ownerId: "some-show", imageId: "def456")
    }`

    const data = await runQuery(query, { accessToken: "user-token" })

    expect(data.originalImageUrl).toBeNull()
  })
})
