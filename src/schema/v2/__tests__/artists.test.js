import { runQuery } from "test/utils"
import gql from "lib/gql"
import { find } from "lodash"

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
        return Promise.resolve(ids.map(_id => ({ _id })))
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

  it("returns a list of artists matching array of slugs", async () => {
    const artistLoader = slug => {
      if (slug) {
        const artists = [
          {
            id: "andy-warhol",
            name: "Andy Warhol",
          },
          {
            id: "pablo-picasso",
            name: "Pablo Picasso",
          },
        ]
        return Promise.resolve(find(artists, item => item.id === slug))
      }
      throw new Error("Unexpected invocation")
    }

    const query = gql`
      {
        artists(slugs: ["andy-warhol", "pablo-picasso"]) {
          id
          name
        }
      }
    `

    const { artists } = await runQuery(query, { artistLoader })
    expect(artists[0].id).toEqual("andy-warhol")
  })
})
