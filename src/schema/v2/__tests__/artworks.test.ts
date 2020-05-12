import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Artworks", () => {
  it("returns total count matching the number of non-empty ids", async () => {
    const artworksLoader = ({ ids }: any) => {
      if (ids) {
        return Promise.resolve(ids.map(_id => ({ _id })))
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        artworks(ids: [null]) {
          totalCount
        }
      }
    `
    const { artworks } = await runQuery(query, { artworksLoader })
    expect(artworks.totalCount).toEqual(0)
  })
})
