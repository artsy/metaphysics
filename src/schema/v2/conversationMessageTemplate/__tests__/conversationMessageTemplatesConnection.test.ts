import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("conversationMessageTemplatesConnection", () => {
  const templates = [
    {
      id: "template-1",
      partner_id: "partner-123",
      title: "General Inquiry",
      description: "Use for first-time inquiries",
      body: "Thank you for your interest.",
      current_version_id: "version-1",
    },
    {
      id: "template-2",
      partner_id: "partner-123",
      title: "Availability",
      description: "Respond to availability questions",
      body: "This work is available.",
      current_version_id: "version-2",
    },
  ]

  const context = {
    partnerLoader: jest.fn().mockResolvedValue({
      id: "partner-123",
      _id: "partner-123",
    }),
    conversationMessageTemplatesLoader: jest.fn().mockResolvedValue({
      body: templates,
      headers: {
        "x-total-count": "2",
      },
    }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns conversation message templates for a partner", async () => {
    const query = gql`
      {
        partner(id: "partner-123") {
          conversationMessageTemplatesConnection(first: 10) {
            edges {
              node {
                internalID
                title
                description
                body
                currentVersionId
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      partner: {
        conversationMessageTemplatesConnection: {
          edges: [
            {
              node: {
                internalID: "template-1",
                title: "General Inquiry",
                description: "Use for first-time inquiries",
                body: "Thank you for your interest.",
                currentVersionId: "version-1",
              },
            },
            {
              node: {
                internalID: "template-2",
                title: "Availability",
                description: "Respond to availability questions",
                body: "This work is available.",
                currentVersionId: "version-2",
              },
            },
          ],
        },
      },
    })
  })

  it("calls the loader with correct parameters", async () => {
    const query = gql`
      {
        partner(id: "partner-123") {
          conversationMessageTemplatesConnection(first: 10) {
            edges {
              node {
                internalID
              }
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(query, context)

    expect(context.conversationMessageTemplatesLoader).toHaveBeenCalledWith({
      partner_id: "partner-123",
      page: 1,
      size: 10,
      total_count: true,
      is_deleted: false,
    })
  })
})
