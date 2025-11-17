import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("Agreement", () => {
  const mockAgreementLoader = jest.fn()

  const context = {
    agreementLoader: mockAgreementLoader,
  }

  beforeEach(() => {
    mockAgreementLoader.mockResolvedValue({
      id: "agreement-123",
      name: "Partner Agreement 2025",
      content: "# Agreement Content\n\nThis is the agreement content.",
      description: "Test agreement description",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      deactivated_at: null,
    })
  })

  afterEach(() => {
    mockAgreementLoader.mockReset()
  })

  it("fetches an agreement by ID", async () => {
    const query = gql`
      {
        agreement(id: "agreement-123") {
          id
          name
          content
          description
          createdAt
          updatedAt
          deactivatedAt
        }
      }
    `

    const result = await runQuery(query, context)

    expect(mockAgreementLoader).toHaveBeenCalledWith("agreement-123")
    expect(result).toMatchObject({
      agreement: {
        id: "agreement-123",
        name: "Partner Agreement 2025",
        content: "# Agreement Content\n\nThis is the agreement content.",
        description: "Test agreement description",
      },
    })
  })

  it("returns null when agreementLoader is not available", async () => {
    const query = gql`
      {
        agreement(id: "agreement-123") {
          id
          name
        }
      }
    `

    const result = await runQuery(query, {})

    expect(result).toMatchObject({
      agreement: null,
    })
  })

  it("handles errors from the loader", async () => {
    mockAgreementLoader.mockRejectedValue(new Error("Agreement not found"))

    const query = gql`
      {
        agreement(id: "nonexistent") {
          id
          name
        }
      }
    `

    await expect(runQuery(query, context)).rejects.toThrow(
      "Agreement not found"
    )
  })
})
