/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("FollowGene", () => {
  const followGeneLoader = jest.fn(() =>
    Promise.resolve({
      gene: {
        family: {},
        id: "pop-art",
        name: "Pop Art",
        image_url: "",
        image_urls: {},
        display_name: null,
      },
    })
  )

  const unfollowGeneLoader = jest.fn(() =>
    Promise.resolve({
      gene: {
        family: {},
        id: "pop-art",
        name: "Pop Art",
        image_url: "",
        image_urls: {},
        display_name: null,
      },
    })
  )

  const geneLoader = () =>
    Promise.resolve({
      family: {
        id: "styles-and-movements",
      },
      id: "pop-art",
      name: "Pop Art",
      browseable: true,
    })

  const context = {
    followGeneLoader,
    unfollowGeneLoader,
    geneLoader,
  }

  const expectedGeneData = {
    gene: {
      slug: "pop-art",
      name: "Pop Art",
    },
  }

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

    await runAuthenticatedQuery(mutation, context).then(({ followGene }) => {
      expect(followGene).toEqual(expectedGeneData)
      expect(followGeneLoader).toHaveBeenCalled()
    })
  })

  it("unfollows a gene", async () => {
    const mutation = `
      mutation {
        followGene(input: { geneID: "pop-art", unfollow: true }) {
          gene {
            slug
            name
          }
        }
      }
    `

    await runAuthenticatedQuery(mutation, context).then(({ followGene }) => {
      expect(followGene).toEqual(expectedGeneData)
      expect(unfollowGeneLoader).toHaveBeenCalled()
    })
  })
})
