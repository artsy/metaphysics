/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

xdescribe("GeneFamilies", () => {
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
        geneFamilies {
          edges {
            node {
              slug
              name
            }
          }
        }
      }
    `

    return runQuery(query, { geneFamiliesLoader }).then((geneFamilies) => {
      expect(geneFamilies).toMatchSnapshot()
    })
  })
})
