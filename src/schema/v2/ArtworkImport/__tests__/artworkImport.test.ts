import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("ArtworkImport", () => {
  it("fetches an artwork import by id", async () => {
    const artworkImportLoader = jest.fn().mockReturnValue({
      id: "artwork-import-1",
      file_name: "import.csv",
    })

    const query = gql`
      query {
        artworkImport(id: "artwork-import-1") {
          internalID
          fileName
        }
      }
    `

    const context = { artworkImportLoader }
    const result = await runAuthenticatedQuery(query, context)

    expect(artworkImportLoader).toHaveBeenCalledWith("artwork-import-1")
    expect(result).toEqual({
      artworkImport: {
        internalID: "artwork-import-1",
        fileName: "import.csv",
      },
    })
  })

  it("fetches rowsConnection with pagination", async () => {
    const artworkImportLoader = jest.fn().mockReturnValue({
      id: "artwork-import-1",
      file_name: "import.csv",
    })

    const artworkImportRowsLoader = jest.fn().mockResolvedValue({
      body: [
        { id: "row1", raw_data: { foo: "bar" } },
        { id: "row2", raw_data: { foo: "baz" } },
      ],
      headers: { "x-total-count": "2" },
    })

    const query = gql`
      query {
        artworkImport(id: "artwork-import-1") {
          internalID
          fileName
          rowsConnection(first: 10) {
            totalCount
            edges {
              node {
                internalID
                rawData
              }
            }
          }
        }
      }
    `

    const context = { artworkImportLoader, artworkImportRowsLoader }
    const result = await runAuthenticatedQuery(query, context)

    expect(artworkImportRowsLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      expect.objectContaining({
        size: 10,
        offset: 0,
        total_count: true,
      })
    )

    expect(result.artworkImport.rowsConnection.totalCount).toBe(2)
    expect(result.artworkImport.rowsConnection.edges).toHaveLength(2)
    expect(result.artworkImport.rowsConnection.edges[0].node).toEqual({
      internalID: "row1",
      rawData: { foo: "bar" },
    })
    expect(result.artworkImport.rowsConnection.edges[1].node).toEqual({
      internalID: "row2",
      rawData: { foo: "baz" },
    })
  })
})
