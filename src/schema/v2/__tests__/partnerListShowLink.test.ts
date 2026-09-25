import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("Show.partnerList", () => {
  const query = gql`
    {
      show(id: "summer-show") {
        partnerList {
          internalID
        }
      }
    }
  `

  const showData = {
    id: "summer-show",
    _id: "show-456",
    displayable: true,
    partner: { id: "partner-123" },
  }

  it("returns the list linked to the show", async () => {
    const context = {
      showLoader: jest.fn().mockResolvedValue(showData),
      partnerListsLoader: jest
        .fn()
        .mockResolvedValue({ body: [{ id: "list-abc" }], headers: {} }),
    }

    const result = await runAuthenticatedQuery(query, context)

    expect(context.partnerListsLoader).toHaveBeenCalledWith({
      partner_id: "partner-123",
      partner_show_id: "show-456",
      size: 1,
    })
    expect(result.show.partnerList).toEqual({ internalID: "list-abc" })
  })

  it("returns null when no list is linked to the show", async () => {
    const context = {
      showLoader: jest.fn().mockResolvedValue(showData),
      partnerListsLoader: jest
        .fn()
        .mockResolvedValue({ body: [], headers: {} }),
    }

    const result = await runAuthenticatedQuery(query, context)

    expect(result.show.partnerList).toBeNull()
  })

  it("returns null when the user can't manage the partner", async () => {
    const context = {
      showLoader: jest.fn().mockResolvedValue(showData),
      partnerListsLoader: jest.fn().mockRejectedValue({ statusCode: 403 }),
    }

    const result = await runAuthenticatedQuery(query, context)

    expect(result.show.partnerList).toBeNull()
  })

  it("returns null for a show without an Artsy partner", async () => {
    const context = {
      showLoader: jest.fn().mockResolvedValue({ ...showData, partner: null }),
      partnerListsLoader: jest.fn(),
      galaxyGalleryLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(query, context)

    expect(context.partnerListsLoader).not.toHaveBeenCalled()
    expect(result.show.partnerList).toBeNull()
  })

  it("returns null when not authenticated", async () => {
    const context = {
      showLoader: jest.fn().mockResolvedValue(showData),
    }

    const result = await runQuery(query, context as any)

    expect(result.show.partnerList).toBeNull()
  })
})
