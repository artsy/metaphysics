import { runQuery } from "test/utils"
import gql from "test/gql"

describe("Artists", () => {
  it("returns a list of artists", async () => {
    const query = gql`
      {
        artists(page: 1, size: 1) {
          name
        }
      }
    `
    const artistsLoader = ({ page, size }) => {
      if (page === 1 && size === 1) {
        return Promise.resolve([
          {
            id: "han-myung-ok",
            name: "Han Myung-Ok",
            birthday: "1958",
            artworks_count: 12,
          },
        ])
      }
      throw new Error("Unexpected invocation")
    }
    const { artists } = await runQuery(query, { artistsLoader })
    expect(artists).toEqual([{ name: "Han Myung-Ok" }])
  })

  it("returns a list of artists matching array of ids", async () => {
    const artistsLoader = ({ ids }) => {
      if (ids) {
        return Promise.resolve([
          {
            _id: "52c721e5b202a3edf1000072",
            name: "Han Myung-Ok",
          },
        ])
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        artists(ids: ["52c721e5b202a3edf1000072"]) {
          _id
        }
      }
    `
    const { artists } = await runQuery(query, { artistsLoader })
    expect(artists[0]._id).toEqual("52c721e5b202a3edf1000072")
  })
})
