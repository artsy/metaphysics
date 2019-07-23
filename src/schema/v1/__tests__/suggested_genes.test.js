import { runQuery } from "test/utils"

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
        suggested_genes {
          id
          _id
          name
          image {
            url
          }
        }
      }
    `

    const data = await runQuery(query, {})

    expect(data.suggested_genes[0]._id).toBe("123456")
    expect(data.suggested_genes[0].image.url).toBe("photography.jpg")
  })
})
