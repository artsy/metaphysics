import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("bulkUpdateMetadataPreview", () => {
  const query = gql`
    {
      partner(id: "catty-partner") {
        bulkUpdateMetadataPreview {
          counts {
            total
            editable
            nonEditable
          }
        }
      }
    }
  `

  const partnerData = {
    _id: "partner-internal-id",
    id: "catty-partner",
  }

  it("returns counts with default args", async () => {
    const context = {
      partnerLoader: jest.fn().mockResolvedValue(partnerData),
      bulkUpdateMetadataPreviewLoader: jest.fn().mockResolvedValue({
        counts: { total: 10, editable: 8 },
      }),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(context.bulkUpdateMetadataPreviewLoader).toHaveBeenCalledWith(
      "catty-partner",
      {}
    )

    expect(data).toEqual({
      partner: {
        bulkUpdateMetadataPreview: {
          counts: { total: 10, editable: 8, nonEditable: 2 },
        },
      },
    })
  })

  it("passes artworkIds as artwork_ids to the loader", async () => {
    const queryWithArgs = gql`
      {
        partner(id: "catty-partner") {
          bulkUpdateMetadataPreview(artworkIds: ["artwork1", "artwork2"]) {
            counts {
              total
              editable
            }
          }
        }
      }
    `

    const context = {
      partnerLoader: jest.fn().mockResolvedValue(partnerData),
      bulkUpdateMetadataPreviewLoader: jest.fn().mockResolvedValue({
        counts: { total: 5, editable: 3 },
      }),
    }

    await runAuthenticatedQuery(queryWithArgs, context)

    expect(context.bulkUpdateMetadataPreviewLoader).toHaveBeenCalledWith(
      "catty-partner",
      {
        artwork_ids: ["artwork1", "artwork2"],
      }
    )
  })

  it("passes partnerListId as partner_list_id to the loader", async () => {
    const queryWithArgs = gql`
      {
        partner(id: "catty-partner") {
          bulkUpdateMetadataPreview(partnerListId: "list-123") {
            counts {
              total
              editable
            }
          }
        }
      }
    `

    const context = {
      partnerLoader: jest.fn().mockResolvedValue(partnerData),
      bulkUpdateMetadataPreviewLoader: jest.fn().mockResolvedValue({
        counts: { total: 20, editable: 15 },
      }),
    }

    await runAuthenticatedQuery(queryWithArgs, context)

    expect(context.bulkUpdateMetadataPreviewLoader).toHaveBeenCalledWith(
      "catty-partner",
      {
        partner_list_id: "list-123",
      }
    )
  })

  it("passes updateCatalog as update_catalog to the loader", async () => {
    const queryWithArgs = gql`
      {
        partner(id: "catty-partner") {
          bulkUpdateMetadataPreview(updateCatalog: true) {
            counts {
              total
              editable
            }
          }
        }
      }
    `

    const context = {
      partnerLoader: jest.fn().mockResolvedValue(partnerData),
      bulkUpdateMetadataPreviewLoader: jest.fn().mockResolvedValue({
        counts: { total: 12, editable: 7 },
      }),
    }

    await runAuthenticatedQuery(queryWithArgs, context)

    expect(context.bulkUpdateMetadataPreviewLoader).toHaveBeenCalledWith(
      "catty-partner",
      {
        update_catalog: true,
      }
    )
  })

  it("passes all args together to the loader", async () => {
    const queryWithArgs = gql`
      {
        partner(id: "catty-partner") {
          bulkUpdateMetadataPreview(
            artworkIds: ["artwork1"]
            partnerListId: "list-456"
            updateCatalog: true
          ) {
            counts {
              total
              editable
              nonEditable
            }
          }
        }
      }
    `

    const context = {
      partnerLoader: jest.fn().mockResolvedValue(partnerData),
      bulkUpdateMetadataPreviewLoader: jest.fn().mockResolvedValue({
        counts: { total: 3, editable: 1 },
      }),
    }

    const data = await runAuthenticatedQuery(queryWithArgs, context)

    expect(context.bulkUpdateMetadataPreviewLoader).toHaveBeenCalledWith(
      "catty-partner",
      {
        artwork_ids: ["artwork1"],
        partner_list_id: "list-456",
        update_catalog: true,
      }
    )

    expect(data).toEqual({
      partner: {
        bulkUpdateMetadataPreview: {
          counts: { total: 3, editable: 1, nonEditable: 2 },
        },
      },
    })
  })

  it("returns null when not authenticated", async () => {
    const context = {
      partnerLoader: jest.fn().mockResolvedValue(partnerData),
    }

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        bulkUpdateMetadataPreview: null,
      },
    })
  })
})
