/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runQuery } from "test/utils"

describe("Popular Artists", () => {
  it("makes a call for popular artists", () => {
    const query = gql`
      {
        popular_artists {
          artists {
            id
          }
        }
      }
    `

    const rootValue = {
      popularArtistsLoader: () =>
        Promise.resolve([
          { birthday: "1900", artworks_count: 100, id: "ortina" },
          { birthday: "1900", artworks_count: 100, id: "xtina" },
        ]),
    }

    expect.assertions(1)
    return runQuery(query, rootValue).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
