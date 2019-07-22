import { find } from "lodash"
import { runQuery } from "test/utils"
import gql from "lib/gql"

describe("Genes", () => {
  const apiResponse = [
    {
      id: "futurism",
      name: "Futurism",
    },
    {
      id: "romanticism",
      name: "Romanticism",
    },
  ]

  it("returns a list of genes matching array of slugs", async () => {
    const geneLoader = slug => {
      if (slug) {
        return Promise.resolve(find(apiResponse, item => item.id === slug))
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        genes(slugs: ["futurism"]) {
          id
          name
        }
      }
    `
    const { genes } = await runQuery(query, { geneLoader })
    expect(genes[0].id).toEqual("futurism")
  })
})
