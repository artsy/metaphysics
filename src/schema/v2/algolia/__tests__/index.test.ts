import { runQuery } from "schema/v2/test/utils"

jest.mock("algoliasearch", () => jest.fn())
import algoliasearch from "algoliasearch"

describe("AlgoliaType", () => {
  it("returns a secured API key from Algolia", () => {
    const query = `
      {
        algolia {
          apiKey
        }
      }
    `

    const mockAlgoliasearch = (algoliasearch as unknown) as jest.Mock<any>
    mockAlgoliasearch.mockImplementationOnce(() => {
      return {
        generateSecuredApiKey: () => Promise.resolve("token"),
      }
    })

    return runQuery(query, { userID: "user-id" }).then((data) => {
      expect(data).toEqual({
        algolia: {
          apiKey: "token",
        },
      })
    })
  })
})
