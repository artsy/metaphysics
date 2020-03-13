import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("ArtworksByInternalID", () => {
  it("returns an empty array if no artworks", async () => {
    const artworksLoader = () => Promise.resolve([])
    const query = gql`
      {
        artworksByInternalID(ids: ["invalid-id-1", "invalid-id-2"]) {
          internalID
        }
      }
    `

    const { artworksByInternalID } = await runQuery(query, { artworksLoader })
    expect(artworksByInternalID).toEqual([])
  })

  it("returns a list of artworks by internalID", async () => {
    const artworksLoader = () =>
      Promise.resolve([
        {
          _id: "foo",
        },
        {
          _id: "bar",
        },
      ])

    const query = gql`
      {
        artworksByInternalID(ids: ["foo", "bar"]) {
          internalID
        }
      }
    `

    const { artworksByInternalID } = await runQuery(query, { artworksLoader })
    expect(artworksByInternalID).toEqual([
      {
        internalID: "foo",
      },
      {
        internalID: "bar",
      },
    ])
  })
})
