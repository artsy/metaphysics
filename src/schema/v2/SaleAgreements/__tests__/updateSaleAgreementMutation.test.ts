import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    updateSaleAgreement(
      input: {
        content: "updated legal terms"
        displayEndAt: "2026-01-01"
        displayStartAt: "2026-01-02"
        id: "saleAgreement-id"
        published: true
        saleId: "abc123"
        status: CURRENT
      }
    ) {
      saleAgreementOrError {
        __typename
        ... on UpdateSaleAgreementSuccess {
          saleAgreement {
            content
            saleId
          }
        }
        ... on UpdateSaleAgreementFailure {
          mutationError {
            type
            message
            detail
          }
        }
      }
    }
  }
`

describe("UpdateSaleAgreementMutation", () => {
  describe("on success", () => {
    const saleAgreement = {
      content: "updated legal terms",
      display_end_at: "2026-01-01",
      display_start_at: "2026-01-02",
      id: "saleAgreement-id",
      published: true,
      sale_id: "abc123",
    }

    const mockUpdateSaleAgreementLoader = jest.fn()

    const context = {
      updateSaleAgreementLoader: mockUpdateSaleAgreementLoader,
    }

    beforeEach(() => {
      mockUpdateSaleAgreementLoader.mockResolvedValue(
        Promise.resolve(saleAgreement)
      )
    })

    afterEach(() => {
      mockUpdateSaleAgreementLoader.mockReset()
    })

    it("returns a saleAgreement", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockUpdateSaleAgreementLoader).toBeCalledWith("saleAgreement-id", {
        content: "updated legal terms",
        display_end_at: "2026-01-01",
        display_start_at: "2026-01-02",
        published: true,
        sale_id: "abc123",
        status: "current",
      })

      expect(res).toEqual({
        updateSaleAgreement: {
          saleAgreementOrError: {
            __typename: "UpdateSaleAgreementSuccess",
            saleAgreement: {
              content: "updated legal terms",
              saleId: "abc123",
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      updateSaleAgreementLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/sale_agreement - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        updateSaleAgreement: {
          saleAgreementOrError: {
            __typename: "UpdateSaleAgreementFailure",
            mutationError: {
              type: "error",
              message: "example message",
              detail: "example detail",
            },
          },
        },
      })
    })
  })
})
