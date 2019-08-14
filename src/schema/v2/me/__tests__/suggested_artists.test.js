/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("SuggestedArtists", () => {
    const context = {
      suggestedArtistsLoader: () => {
        return Promise.resolve({
          body: [
            {
              id: "andy-warhol",
              birthday: "1919",
              artworks_count: 50,
            },
          ],
        })
      },
    }

    it("returns sanitized messages", () => {
      const query = `
        {
          me {
            suggestedArtists(artistID: "andy-warhol") {
              slug
              birthday
            }
          }
        }
      `

      return runAuthenticatedQuery(query, context).then(
        ({ me: conversation }) => {
          expect(conversation).toMatchSnapshot()
        }
      )
    })
  })
})
