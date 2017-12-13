import schema from "schema"
import { runQuery } from "test/utils"

describe("SuggestedGenes type", () => {
  const SuggestedGenes = schema.__get__("SuggestedGenes")
  let fetch = null
  let suggestedGenesData = null

  beforeEach(() => {
    fetch = sinon.stub()

    suggestedGenesData = {
      body: [
        {
          id: "photography",
          image_url: "photography.jpg",
          name: "Photography",
          _id: "123456",
        },
      ],
    }

    fetch.returns(Promise.resolve(suggestedGenesData))

    SuggestedGenes.__Rewire__("fetch", fetch)
  })

  afterEach(() => {
    SuggestedGenes.__ResetDependency__("fetch")
  })

  it("fetches suggested genes", () => {
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

    return runQuery(query, {}).then(data => {
      expect(data.suggested_genes[0]._id).toBe("123456")
      expect(data.suggested_genes[0].image.url).toBe("photography.jpg")
    })
  })
})
