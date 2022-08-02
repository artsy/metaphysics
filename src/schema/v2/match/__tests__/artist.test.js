/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("MatchArtist", () => {
  it("queries match/artist for the term 'ok'", () => {
    const query = gql`
      {
        matchArtist(term: "ok") {
          slug
          name
          birthday
        }
      }
    `
    const matchArtistsLoader = () =>
      Promise.resolve([
        {
          id: "han-myung-ok",
          name: "Han Myung-Ok",
          birthday: "1958",
          artworks_count: 12,
        },
      ])

    return runQuery(query, { matchArtistsLoader }).then((data) => {
      expect(data).toEqual({
        matchArtist: [
          { birthday: "1958", slug: "han-myung-ok", name: "Han Myung-Ok" },
        ],
      })
    })
  })
})
