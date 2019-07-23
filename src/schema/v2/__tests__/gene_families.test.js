/* eslint-disable promise/always-return */
import { runV2Query } from "test/utils"

describe("GeneFamilies", () => {
  const api_data = [
    {
      id: "design-concepts-and-techniques",
      name: "Design Concepts and Techniques",
    },
    {
      id: "furniture-and-lighting",
      name: "Furniture & Lighting",
    },
  ]

  it("returns a list of gene families", () => {
    const geneFamiliesLoader = () => Promise.resolve(api_data)
    const query = `
      {
        gene_families {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `

    return runV2Query(query, { geneFamiliesLoader }).then(geneFamilies => {
      expect(geneFamilies).toMatchSnapshot()
    })
  })
})
