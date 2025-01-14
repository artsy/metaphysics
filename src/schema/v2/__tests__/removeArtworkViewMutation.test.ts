/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("removing an artwork view", () => {
  const query = `
  mutation {
    removeArtworkView(input: { artwork_id: "artwork-id" }) {
      artworkId
    }
  }
  `

  const context = {
    deleteArtworkViewLoader: (id) => Promise.resolve({ artwork_id: id }),
  }

  it("removes an artwork view", async () => {
    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      removeArtworkView: {
        artworkId: "artwork-id",
      },
    })
  })
})
