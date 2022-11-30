import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkMutation", () => {
  it("updates an artwork", async () => {
    const mutation = `
      mutation {
        updateArtwork(input: { id: "25", availability: "sold" }) {
          artwork {
            availability
          }
        }
      }
    `

    const context = {
      updateArtworkLoader: () =>
        Promise.resolve({
          availability: "sold",
        }),
    }

    try {
      const artwork = await runAuthenticatedQuery(mutation, context)
      expect(artwork).toEqual({
        updateArtwork: { artwork: { availability: "sold" } },
      })
    } catch (error) {
      console.log(error)
    }
  })
})
