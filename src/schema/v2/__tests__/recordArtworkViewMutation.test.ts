/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("recording an artwork view", () => {
  const query = `
  mutation {
    recordArtworkView(input: { artwork_id: "artwork-id" }) {
      artworkId
    }
  }
  `

  const context = {
    createArtworkViewLoader: (id) => Promise.resolve({ artwork_id: id }),
  }

  it("records an artwork view", async () => {
    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      recordArtworkView: {
        artworkId: "artwork-id",
      },
    })
  })
})
