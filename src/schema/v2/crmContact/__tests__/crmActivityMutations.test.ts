import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const activity = {
  id: "activity-1",
  crm_contact_id: "contact-1",
  partner_id: "partner-1",
  kind: "note",
  subject: "Fair",
  description: "Met at the fair",
}

describe("CRM activity mutations", () => {
  it("creates an activity", async () => {
    const createCrmActivityLoader = jest.fn().mockResolvedValue(activity)

    const result = await runAuthenticatedQuery(
      `mutation {
        createCRMActivity(input: { crmContactID: "contact-1", kind: NOTE, subject: "Fair", description: "Met at the fair" }) {
          crmActivityOrError {
            ... on CreateCRMActivitySuccess { crmActivity { internalID kind subject description } }
          }
        }
      }`,
      { createCrmActivityLoader }
    )

    expect(createCrmActivityLoader).toHaveBeenCalledWith({
      crm_contact_id: "contact-1",
      description: "Met at the fair",
      kind: "note",
      subject: "Fair",
    })
    expect(result.createCRMActivity.crmActivityOrError).toEqual({
      crmActivity: {
        internalID: "activity-1",
        kind: "NOTE",
        subject: "Fair",
        description: "Met at the fair",
      },
    })
  })

  it("returns a mutation error when Gravity rejects the activity", async () => {
    const createCrmActivityLoader = jest.fn().mockRejectedValue(
      new HTTPError(
        "Gravity Error",
        400,
        JSON.stringify({
          type: "param_error",
          message: "kind does not have a valid value",
        })
      )
    )

    const result = await runAuthenticatedQuery(
      `mutation {
        createCRMActivity(input: { crmContactID: "contact-1", kind: EMAIL, description: "Hi" }) {
          crmActivityOrError {
            ... on CreateCRMActivityFailure { mutationError { message } }
          }
        }
      }`,
      { createCrmActivityLoader }
    )

    expect(
      result.createCRMActivity.crmActivityOrError.mutationError.message
    ).toBeDefined()
  })

  it("updates an activity", async () => {
    const updateCrmActivityLoader = jest.fn().mockResolvedValue({
      ...activity,
      subject: "Edited subject",
      description: "Edited",
    })

    const result = await runAuthenticatedQuery(
      `mutation {
        updateCRMActivity(input: { id: "activity-1", subject: "Edited subject", description: "Edited" }) {
          crmActivityOrError {
            ... on UpdateCRMActivitySuccess { crmActivity { subject description } }
          }
        }
      }`,
      { updateCrmActivityLoader }
    )

    expect(updateCrmActivityLoader).toHaveBeenCalledWith("activity-1", {
      description: "Edited",
      subject: "Edited subject",
    })
    expect(result.updateCRMActivity.crmActivityOrError).toEqual({
      crmActivity: { subject: "Edited subject", description: "Edited" },
    })
  })

  it("deletes an activity", async () => {
    const deleteCrmActivityLoader = jest.fn().mockResolvedValue(activity)

    const result = await runAuthenticatedQuery(
      `mutation {
        deleteCRMActivity(input: { id: "activity-1" }) {
          crmActivityOrError {
            ... on DeleteCRMActivitySuccess { crmActivity { internalID } }
          }
        }
      }`,
      { deleteCrmActivityLoader }
    )

    expect(deleteCrmActivityLoader).toHaveBeenCalledWith("activity-1")
    expect(result.deleteCRMActivity.crmActivityOrError).toEqual({
      crmActivity: { internalID: "activity-1" },
    })
  })
})
