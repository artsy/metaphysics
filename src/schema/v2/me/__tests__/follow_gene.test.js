/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("FollowGene", () => {
  it("follows a gene", async () => {
    const mutation = `
      mutation {
        followGene(input: { geneID: "pop-art" }) {
          gene {
            slug
            name
          }
        }
      }
    `

    const context = {
      followGeneLoader: () =>
        Promise.resolve({
          gene: {
            family: {},
            id: "pop-art",
            name: "Pop Art",
            image_url: "",
            image_urls: {},
            display_name: null,
          },
        }),
      geneLoader: () =>
        Promise.resolve({
          family: {
            id: "styles-and-movements",
          },
          id: "pop-art",
          name: "Pop Art",
          browseable: true,
        }),
    }

    const expectedGeneData = {
      gene: {
        slug: "pop-art",
        name: "Pop Art",
      },
    }

    await runAuthenticatedQuery(mutation, context).then(({ followGene }) => {
      expect(followGene).toEqual(expectedGeneData)
    })
  })
})
