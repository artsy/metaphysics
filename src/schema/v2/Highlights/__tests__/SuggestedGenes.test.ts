import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/apis/fetch", () => jest.fn())
const fetch: jest.Mock = require("lib/apis/fetch")

describe("SuggestedGenes type", () => {
  const suggestedGenesData = {
    body: [
      {
        id: "photography",
        image_url: "photography.jpg",
        name: "Photography",
        _id: "123456",
      },
    ],
  }

  it("fetches suggested genes", async () => {
    fetch.mockReturnValueOnce(Promise.resolve(suggestedGenesData))

    const query = `
      {
        highlights {
          suggestedGenes {
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
    expect(highlights.suggestedGenes[0].internalID).toBe("123456")
    expect(highlights.suggestedGenes[0].image.url).toBe("photography.jpg")
  })
})
