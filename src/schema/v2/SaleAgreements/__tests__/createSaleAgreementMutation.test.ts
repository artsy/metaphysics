import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createSaleAgreement(
      input: {
        content: "legal terms of a specific sale"
        published: true
        saleId: "abc123"
        status: CURRENT
        displayEndAt: "2026-01-01"
        displayStartAt: "2026-01-02"
      }
    ) {
      saleAgreementOrError {
        __typename
        ... on CreateSaleAgreementSuccess {
          saleAgreement {
            content
            saleId
          }
        }
        ... on CreateSaleAgreementFailure {
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

describe("CreateSaleAgreementMutation", () => {
  describe("on success", () => {
    const saleAgreement = {
      id: "saleAgreement-id",
      content: "legal terms of a specific sale",
      published: true,
      sale_id: "abc123",
      display_end_at: "2026-01-01",
      display_start_at: "2026-01-02",
    }

    const mockCreateSaleAgreementLoader = jest.fn()

    const context = {
      createSaleAgreementLoader: mockCreateSaleAgreementLoader,
    }

    beforeEach(() => {
      mockCreateSaleAgreementLoader.mockResolvedValue(
        Promise.resolve(saleAgreement)
      )
    })

    afterEach(() => {
      mockCreateSaleAgreementLoader.mockReset()
    })

    it("returns a saleAgreement", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockCreateSaleAgreementLoader).toBeCalledWith({
        content: "legal terms of a specific sale",
        published: true,
        sale_id: "abc123",
        status: "current",
        display_end_at: "2026-01-01",
        display_start_at: "2026-01-02",
      })

      expect(res).toEqual({
        createSaleAgreement: {
          saleAgreementOrError: {
            __typename: "CreateSaleAgreementSuccess",
            saleAgreement: {
              content: "legal terms of a specific sale",
              saleId: "abc123",
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      createSaleAgreementLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/sale_agreement - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        createSaleAgreement: {
          saleAgreementOrError: {
            __typename: "CreateSaleAgreementFailure",
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
