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

  it("a partner can fetch their artwork imports", async () => {
    const artworkImportsLoader = jest.fn().mockResolvedValue({
      body: [
        { id: "artwork-import-1", file_name: "import.csv" },
        { id: "artwork-import-2", file_name: "import2.csv" },
      ],
      headers: { "x-total-count": "2" },
    })
    const partnerLoader = jest.fn().mockResolvedValue({
      id: "partner-1",
    })

    const query = gql`
      query {
        partner(id: "partner-1") {
          artworkImportsConnection(first: 10) {
            totalCount
            edges {
              node {
                internalID
                fileName
              }
            }
          }
        }
      }
    `

    const context = { artworkImportsLoader, partnerLoader }
    const result = await runAuthenticatedQuery(query, context)

    expect(artworkImportsLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 10,
        page: 1,
        partner_id: "partner-1",
        total_count: true,
      })
    )

    expect(result.partner.artworkImportsConnection.totalCount).toBe(2)
    expect(result.partner.artworkImportsConnection.edges).toHaveLength(2)
    expect(result.partner.artworkImportsConnection.edges[0].node).toEqual({
      internalID: "artwork-import-1",
      fileName: "import.csv",
    })
    expect(result.partner.artworkImportsConnection.edges[1].node).toEqual({
      internalID: "artwork-import-2",
      fileName: "import2.csv",
    })
  })

  it("fetches date fields from artwork import rows", async () => {
    const artworkImportLoader = jest.fn().mockReturnValue({
      id: "artwork-import-1",
      file_name: "import.csv",
    })

    const artworkImportRowsLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "row1",
          date_approximate: true,
          date_custom: "Early Renaissance",
          date_earliest_year: 2020,
          date_latest_year: 2023,
          date_mode: "year_range",
          transformed_data: {
            DateApproximate: "true",
            DateCustom: "Early Renaissance",
            DateEarliestYear: "2020",
            DateLatestYear: "2023",
            DateMode: "year_range",
          },
        },
      ],
      headers: { "x-total-count": "1" },
    })

    const query = gql`
      query {
        artworkImport(id: "artwork-import-1") {
          rowsConnection(first: 10) {
            edges {
              node {
                internalID
                dateApproximate
                dateCustom
                dateEarliestYear
                dateLatestYear
                dateMode
                transformedData {
                  dateApproximate
                  dateCustom
                  dateEarliestYear
                  dateLatestYear
                  dateMode
                }
              }
            }
          }
        }
      }
    `

    const context = { artworkImportLoader, artworkImportRowsLoader }
    const result = await runAuthenticatedQuery(query, context)

    expect(result.artworkImport.rowsConnection.edges[0].node).toEqual({
      internalID: "row1",
      dateApproximate: true,
      dateCustom: "Early Renaissance",
      dateEarliestYear: 2020,
      dateLatestYear: 2023,
      dateMode: "YEAR_RANGE",
      transformedData: {
        dateApproximate: "true",
        dateCustom: "Early Renaissance",
        dateEarliestYear: "2020",
        dateLatestYear: "2023",
        dateMode: "year_range",
      },
    })
  })
})
