import gql from "lib/gql"
import { runQuery } from "test/utils"

describe("Trending Artists", () => {
  it("makes a call for trending artists", async () => {
    const query = gql`
      {
        trending_artists(name: ARTIST_FAIR) {
          artists {
            id
          }
        }
      }
    `
    const rootValue = {
      deltaLoader: ({ name }) =>
        name === "artist_fair" &&
        Promise.resolve({
          ortina: null,
          xtina: null,
          cached: null,
          context_type: null,
        }),
      artistLoader: id =>
        Promise.resolve({ id, birthday: "1900", artworks_count: 100 }),
    }

    const {
      trending_artists: { artists },
    } = await runQuery(query, rootValue)
    expect(artists).toMatchSnapshot()
  })
})
