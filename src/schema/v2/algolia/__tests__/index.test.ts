import { runQuery } from "schema/v2/test/utils"

jest.mock("algoliasearch", () => jest.fn())
import algoliasearch from "algoliasearch"

describe("AlgoliaType", () => {
  it("returns a secured API key from Algolia for unauthenticated users", () => {
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

    return runQuery(query).then((data) => {
      expect(data).toEqual({
        algolia: {
          apiKey: "token",
        },
      })
    })
  })

  it("returns a secured API key from Algolia for authenticated users", () => {
    const query = `
      {
        algolia {
          apiKey
        }
      }
    `

    const meLoader: jest.Mock<any> = jest.fn()
    meLoader.mockImplementationOnce(() => Promise.resolve({ _id: "user-id" }))

    const mockAlgoliasearch = (algoliasearch as unknown) as jest.Mock<any>
    mockAlgoliasearch.mockImplementationOnce(() => {
      return {
        generateSecuredApiKey: () => Promise.resolve("token"),
      }
    })

    runQuery(query, { meLoader }).then((data) => {
      expect(data).toEqual({
        algolia: {
          apiKey: "token",
        },
      })
    })

    expect(meLoader).toBeCalled()
  })
})
