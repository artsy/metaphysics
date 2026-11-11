import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const pendingReview = {
  id: "review-1",
  partner_id: "partner-1",
  address: "unknown@example.com",
  status: "pending",
  message_count: 2,
}

const gravityError = (statusCode: number, body: Record<string, unknown>) =>
  new HTTPError("Gravity error", statusCode, body as any)

describe("approveEmailSenderReview", () => {
  const mutation = `
    mutation {
      approveEmailSenderReview(input: { id: "review-1", crmContactID: "contact-1" }) {
        emailSenderReviewOrError {
          __typename
          ... on ApproveEmailSenderReviewSuccess {
            emailSenderReview { internalID status crmContactID }
          }
          ... on ApproveEmailSenderReviewFailure {
            mutationError { message statusCode }
          }
        }
      }
    }
  `

  it("passes the crmContactID to Gravity", async () => {
    const approveEmailSenderReviewLoader = jest
      .fn()
      .mockResolvedValue({ ...pendingReview, status: "approved" })

    await runAuthenticatedQuery(mutation, { approveEmailSenderReviewLoader })

    expect(approveEmailSenderReviewLoader).toHaveBeenCalledWith("review-1", {
      crm_contact_id: "contact-1",
    })
  })

  it("returns the approved review", async () => {
    const result = await runAuthenticatedQuery(mutation, {
      approveEmailSenderReviewLoader: jest.fn().mockResolvedValue({
        ...pendingReview,
        status: "approved",
        crm_contact_id: "contact-1",
      }),
    })

    expect(result.approveEmailSenderReview.emailSenderReviewOrError).toEqual({
      __typename: "ApproveEmailSenderReviewSuccess",
      emailSenderReview: {
        internalID: "review-1",
        status: "APPROVED",
        crmContactID: "contact-1",
      },
    })
  })

  it("returns a failure when Gravity rejects the request", async () => {
    const result = await runAuthenticatedQuery(mutation, {
      approveEmailSenderReviewLoader: jest.fn().mockRejectedValue(
        gravityError(409, {
          type: "param_error",
          message: "Review is not pending",
        })
      ),
    })

    expect(result.approveEmailSenderReview.emailSenderReviewOrError).toEqual({
      __typename: "ApproveEmailSenderReviewFailure",
      mutationError: {
        message: "Review is not pending",
        statusCode: 409,
      },
    })
  })
})

describe("skipEmailSenderReview and unskipEmailSenderReview", () => {
  it("skips a review", async () => {
    const skipEmailSenderReviewLoader = jest
      .fn()
      .mockResolvedValue({ ...pendingReview, status: "skipped" })

    const result = await runAuthenticatedQuery(
      `mutation {
        skipEmailSenderReview(input: { id: "review-1" }) {
          emailSenderReviewOrError {
            ... on SkipEmailSenderReviewSuccess { emailSenderReview { status } }
          }
        }
      }`,
      { skipEmailSenderReviewLoader }
    )

    expect(skipEmailSenderReviewLoader).toHaveBeenCalledWith("review-1")
    expect(result.skipEmailSenderReview.emailSenderReviewOrError).toEqual({
      emailSenderReview: { status: "SKIPPED" },
    })
  })

  it("unskips a review", async () => {
    const unskipEmailSenderReviewLoader = jest
      .fn()
      .mockResolvedValue(pendingReview)

    const result = await runAuthenticatedQuery(
      `mutation {
        unskipEmailSenderReview(input: { id: "review-1" }) {
          emailSenderReviewOrError {
            ... on UnskipEmailSenderReviewSuccess { emailSenderReview { status } }
          }
        }
      }`,
      { unskipEmailSenderReviewLoader }
    )

    expect(unskipEmailSenderReviewLoader).toHaveBeenCalledWith("review-1")
    expect(result.unskipEmailSenderReview.emailSenderReviewOrError).toEqual({
      emailSenderReview: { status: "PENDING" },
    })
  })
})
