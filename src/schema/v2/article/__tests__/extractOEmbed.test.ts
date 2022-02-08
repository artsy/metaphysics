import { extractOEmbed } from "../lib/extractOEmbed"
import fetch from "node-fetch"

jest.mock("node-fetch")

describe("extractOEmbed", () => {
  const mockFetch = (fetch as unknown) as jest.Mock<any>

  beforeEach(() => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            html: '<iframe src="https://example.com"></iframe>',
          }),
      })
    })
  })

  afterEach(() => {
    mockFetch.mockReset()
  })

  it("makes the appropriate fetch", async () => {
    const res = await extractOEmbed(
      "https://twitter.com/kanyewest/status/1277964735887978499"
    )

    expect(res.html).toEqual('<iframe src="https://example.com"></iframe>')

    expect(mockFetch).toBeCalledWith(
      "https://publish.twitter.com/oembed?url=https%3A%2F%2Ftwitter.com%2Fkanyewest%2Fstatus%2F1277964735887978499"
    )
  })
})
