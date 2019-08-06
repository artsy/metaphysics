/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("Popular Artists", () => {
  it("makes a call for popular artists", async () => {
    const query = gql`
      {
        popularArtists {
          artists {
            slug
          }
        }
      }
    `

    const context = {
      popularArtistsLoader: () =>
        Promise.resolve([
          { birthday: "1900", artworks_count: 100, id: "ortina" },
          { birthday: "1900", artworks_count: 100, id: "xtina" },
        ]),
    }

    await runQuery(query, context).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
