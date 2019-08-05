import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/apis/fetch", () => jest.fn())
import fetch from "lib/apis/fetch"

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
        suggestedGenes {
          slug
          internalID
          name
          image {
            url
          }
        }
      }
    `

    const data = await runQuery(query, {})

    expect(data.suggestedGenes[0].internalID).toBe("123456")
    expect(data.suggestedGenes[0].image.url).toBe("photography.jpg")
  })
})
