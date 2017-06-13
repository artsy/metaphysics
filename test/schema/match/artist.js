import schema from "schema"
import { runQuery } from "test/utils"

describe("MatchArtist", () => {
  let gravity

  const MatchArtist = schema.__get__("MatchArtist")

  beforeEach(() => {
    gravity = sinon.stub()
    MatchArtist.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    MatchArtist.__ResetDependency__("gravity")
  })

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
    const response = [
      {
        id: "han-myung-ok",
        name: "Han Myung-Ok",
        birthday: "1958",
        artworks_count: 12,
      },
    ]
    gravity.withArgs("match/artists", { term: "ok" }).returns(Promise.resolve(response))

    return runQuery(query).then(data => {
      expect(data).toEqual({
        match_artist: [{ birthday: "1958", id: "han-myung-ok", name: "Han Myung-Ok" }],
      })
    })
  })
})
