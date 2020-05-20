import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Artworks", () => {
  it("returns total count matching the length of body returned from artworks loader", async () => {
    const artworks_result = [{ _id: "123" }, { _id: "456" }, { _id: "789" }]
    const artworksLoader = ({ ids }: any) => {
      if (ids) {
        return Promise.resolve(artworks_result)
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        artworks(ids: ["123", "456", "789", "-1"]) {
          totalCount
        }
      }
    `
    const { artworks } = await runQuery(query, { artworksLoader })
    expect(artworks.totalCount).toEqual(3)
  })

  it("returns total count 0 when artworks loader returns an empty array", async () => {
    const artworksLoader = ({ ids }: any) => {
      if (ids) {
        return Promise.resolve([])
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        artworks(ids: [null, "-1", "-2", "-3"]) {
          totalCount
        }
      }
    `
    const { artworks } = await runQuery(query, { artworksLoader })
    expect(artworks.totalCount).toEqual(0)
  })
})
