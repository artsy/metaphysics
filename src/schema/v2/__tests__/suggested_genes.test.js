import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/apis/fetch", () => jest.fn())
import fetch from "lib/apis/fetch"

describe("SuggestedGenes type", () => {
  const suggestedGenesData = {
    body: [
      {
        slug: "photography",
        image_url: "photography.jpg",
        name: "Photography",
        internalID: "123456",
      },
    ],
  }

  it("fetches suggested genes", async () => {
    fetch.mockReturnValueOnce(Promise.resolve(suggestedGenesData))

    const query = `
      {
        suggested_genes {
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

    expect(data.suggested_genes[0].internalID).toBe("123456")
    expect(data.suggested_genes[0].image.url).toBe("photography.jpg")
  })
})
