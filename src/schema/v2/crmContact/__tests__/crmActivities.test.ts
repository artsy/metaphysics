import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("crmActivitiesConnection", () => {
  const query = `{
    crmActivitiesConnection(crmContactID: "contact-1", kind: EMAIL, sort: OCCURRED_AT_ASC, first: 5) {
      totalCount
      edges {
        node {
          internalID
          kind
          emailMessage {
            direction
            contentVisible
            subject
            snippet
            participants { role address crmContactID }
          }
        }
      }
    }
  }`

  it("passes params to the loader and returns the connection", async () => {
    const crmActivitiesLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "activity-1",
          crm_contact_id: "contact-1",
          partner_id: "partner-1",
          kind: "email",
          email_message: {
            id: "message-1",
            direction: "inbound",
            content_visible: true,
            subject: "The show",
            snippet: "Hello there",
            participants: [
              {
                id: "p1",
                role: "from",
                address: "ada@example.com",
                crm_contact_id: "contact-1",
              },
            ],
          },
        },
      ],
      headers: { "x-total-count": "1" },
    })

    const result = await runAuthenticatedQuery(query, { crmActivitiesLoader })

    expect(crmActivitiesLoader).toHaveBeenCalledWith({
      crm_contact_id: "contact-1",
      kind: "email",
      sort: "occurred_at",
      total_count: true,
      size: 5,
      offset: 0,
    })
    expect(result.crmActivitiesConnection.totalCount).toBe(1)
    expect(result.crmActivitiesConnection.edges[0].node).toEqual({
      internalID: "activity-1",
      kind: "EMAIL",
      emailMessage: {
        direction: "INBOUND",
        contentVisible: true,
        subject: "The show",
        snippet: "Hello there",
        participants: [
          {
            role: "FROM",
            address: "ada@example.com",
            crmContactID: "contact-1",
          },
        ],
      },
    })
  })

  it("returns null content when the viewer may not read the message", async () => {
    const crmActivitiesLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "activity-1",
          crm_contact_id: "contact-1",
          partner_id: "partner-1",
          kind: "email",
          email_message: {
            id: "message-1",
            direction: "inbound",
            content_visible: false,
            subject: null,
            snippet: null,
            participants: [],
          },
        },
      ],
      headers: { "x-total-count": "1" },
    })

    const result = await runAuthenticatedQuery(query, { crmActivitiesLoader })

    expect(
      result.crmActivitiesConnection.edges[0].node.emailMessage
    ).toMatchObject({ contentVisible: false, subject: null, snippet: null })
  })

  it("returns a null emailMessage for notes", async () => {
    const crmActivitiesLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "activity-2",
          crm_contact_id: "contact-1",
          partner_id: "partner-1",
          kind: "note",
          email_message: null,
        },
      ],
      headers: { "x-total-count": "1" },
    })

    const result = await runAuthenticatedQuery(query, { crmActivitiesLoader })

    expect(result.crmActivitiesConnection.edges[0].node).toMatchObject({
      kind: "NOTE",
      emailMessage: null,
    })
  })
})
