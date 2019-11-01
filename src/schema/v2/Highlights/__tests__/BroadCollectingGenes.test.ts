import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/apis/fetch", () => jest.fn())
const fetch: jest.Mock = require("lib/apis/fetch")

describe("BroadCollectingGenes", () => {
  const broadCollectingGenesData = {
    body: [
      {
        id: "photography",
        image_url: "photography.jpg",
        name: "Photography",
        _id: "123456",
      },
    ],
  }

  it("fetches the genes", async () => {
    fetch.mockReturnValueOnce(Promise.resolve(broadCollectingGenesData))

    const query = `
      {
        highlights {
          broadCollectingGenes {
            slug
            internalID
            name
            image {
              url
            }
          }
        }
      }
    `

    const { highlights } = await runQuery(query)
    expect(highlights.broadCollectingGenes[0].internalID).toBe("123456")
    expect(highlights.broadCollectingGenes[0].image.url).toBe("photography.jpg")
  })
})
