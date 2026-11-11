import { runAuthenticatedQuery } from "schema/v2/test/utils"

const review = {
  id: "review-1",
  partner_id: "partner-1",
  email_account_id: "account-1",
  address: "unknown@example.com",
  name: "Unknown Sender",
  to_address: "gallery@partner.com",
  status: "pending",
  message_count: 3,
  crm_contact_id: null,
  decided_by_id: null,
  decided_at: null,
  first_seen_at: "2026-11-01T00:00:00+00:00",
  last_seen_at: "2026-11-09T00:00:00+00:00",
}

describe("emailSenderReview", () => {
  const query = `{
    emailSenderReview(id: "review-1") {
      internalID
      partnerID
      emailAccountID
      address
      name
      toAddress
      status
      messageCount
      crmContactID
      decidedByID
    }
  }`

  it("returns the review", async () => {
    const emailSenderReviewLoader = jest.fn().mockResolvedValue(review)

    const result = await runAuthenticatedQuery(query, {
      emailSenderReviewLoader,
    })

    expect(emailSenderReviewLoader).toHaveBeenCalledWith("review-1")
    expect(result.emailSenderReview).toEqual({
      internalID: "review-1",
      partnerID: "partner-1",
      emailAccountID: "account-1",
      address: "unknown@example.com",
      name: "Unknown Sender",
      toAddress: "gallery@partner.com",
      status: "PENDING",
      messageCount: 3,
      crmContactID: null,
      decidedByID: null,
    })
  })
})

describe("emailSenderReviewsConnection", () => {
  const query = `{
    emailSenderReviewsConnection(partnerID: "partner-1", status: PENDING, first: 5) {
      totalCount
      edges {
        node { internalID address status }
      }
    }
  }`

  it("passes params to the loader and returns the connection", async () => {
    const emailSenderReviewsLoader = jest.fn().mockResolvedValue({
      body: [review],
      headers: { "x-total-count": "1" },
    })

    const result = await runAuthenticatedQuery(query, {
      emailSenderReviewsLoader,
    })

    expect(emailSenderReviewsLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
      status: "pending",
      total_count: true,
      size: 5,
      offset: 0,
    })
    expect(result.emailSenderReviewsConnection.totalCount).toBe(1)
    expect(result.emailSenderReviewsConnection.edges[0].node).toEqual({
      internalID: "review-1",
      address: "unknown@example.com",
      status: "PENDING",
    })
  })

  it("omits status from the loader params when not given or null", async () => {
    const emailSenderReviewsLoader = jest.fn().mockResolvedValue({
      body: [],
      headers: { "x-total-count": "0" },
    })

    await runAuthenticatedQuery(
      `{ emailSenderReviewsConnection(partnerID: "partner-1", first: 5) { totalCount } }`,
      { emailSenderReviewsLoader }
    )

    expect(
      Object.keys(emailSenderReviewsLoader.mock.calls[0][0]).sort()
    ).toEqual(["offset", "partner_id", "size", "total_count"])

    await runAuthenticatedQuery(
      `{ emailSenderReviewsConnection(partnerID: "partner-1", first: 5, status: null) { totalCount } }`,
      { emailSenderReviewsLoader }
    )

    expect(
      Object.keys(emailSenderReviewsLoader.mock.calls[1][0]).sort()
    ).toEqual(["offset", "partner_id", "size", "total_count"])
  })
})
