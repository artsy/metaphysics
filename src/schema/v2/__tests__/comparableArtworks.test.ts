/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

const mockComparableArtworkresult = {
  id: "foo-bar",
  sale_date_text: "10-12-2020",
  currency: "EUR",
}

describe("ComparableArtwork type", () => {
  it("fetches an comparableArtwork by ID", () => {
    const query = `
      {
        comparableArtworks(id: "foo-bar") {
          currency
          saleDateText
        }
      }
    `

    const context = {
      comparableArtworksLoader: jest.fn(() =>
        Promise.resolve(mockComparableArtworkresult)
      ),
    }

    return runQuery(query, context!).then((data) => {
      expect(data.comparableArtworks.currency).toBe("EUR")
      expect(data.comparableArtworks.saleDateText).toEqual("10-12-2020")
    })
  })
})
