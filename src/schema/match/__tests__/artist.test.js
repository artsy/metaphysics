import { runQuery } from "test/utils"

describe("MatchArtist", () => {
  it("queries match/artist for the term 'ok'", () => {
    const query = `
      {
        match_artist(term: "ok") {
          id
          name
          birthday
        }
      }
    `
    const matchArtistsLoader = () =>
      {return Promise.resolve([
        {
          id: "han-myung-ok",
          name: "Han Myung-Ok",
          birthday: "1958",
          artworks_count: 12,
        },
      ])}

    return runQuery(query, { matchArtistsLoader }).then(data => {
      expect(data).toEqual({
        match_artist: [
          { birthday: "1958", id: "han-myung-ok", name: "Han Myung-Ok" },
        ],
      })
    })
  })
})
