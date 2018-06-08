/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("SuggestedArtists", () => {
    const rootValue = {
      suggestedArtistsLoader: () =>
        Promise.resolve({
          body: [
            {
              id: "andy-warhol",
              birthday: "1919",
              artworks_count: 50,
            },
          ],
        }),
    }

    it("returns sanitized messages", () => {
      const query = `
        {
          me {
            suggested_artists(artist_id: "pablo-picasso") {
              id
              birthday
            }
          }
        }
      `

      return runAuthenticatedQuery(query, rootValue).then(
        ({ me: conversation }) => {
          expect(conversation).toMatchSnapshot()
        }
      )
    })
  })
})
