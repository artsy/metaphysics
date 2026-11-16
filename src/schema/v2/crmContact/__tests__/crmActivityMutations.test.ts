import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const note = {
  id: "activity-1",
  crm_contact_id: "contact-1",
  partner_id: "partner-1",
  kind: "note",
  subject: "Fair",
  description: "Met at the fair",
}

describe("CRM activity note mutations", () => {
  it("creates a note", async () => {
    const createCrmActivityLoader = jest.fn().mockResolvedValue(note)

    const result = await runAuthenticatedQuery(
      `mutation {
        createCRMActivityNote(input: { crmContactID: "contact-1", subject: "Fair", description: "Met at the fair", occurredAt: "2026-01-02T10:00:00Z" }) {
          crmActivityOrError {
            ... on CreateCRMActivityNoteSuccess { crmActivity { internalID kind subject description } }
          }
        }
      }`,
      { createCrmActivityLoader }
    )

    expect(createCrmActivityLoader).toHaveBeenCalledWith({
      crm_contact_id: "contact-1",
      kind: "note",
      subject: "Fair",
      description: "Met at the fair",
      occurred_at: "2026-01-02T10:00:00Z",
    })
    expect(result.createCRMActivityNote.crmActivityOrError).toEqual({
      crmActivity: {
        internalID: "activity-1",
        kind: "NOTE",
        subject: "Fair",
        description: "Met at the fair",
      },
    })
  })

  it("returns a mutation error when Gravity rejects the note", async () => {
    const createCrmActivityLoader = jest.fn().mockRejectedValue(
      new HTTPError(
        "Gravity Error",
        400,
        JSON.stringify({
          type: "param_error",
          message: "Body can't be blank",
        })
      )
    )

    const result = await runAuthenticatedQuery(
      `mutation {
        createCRMActivityNote(input: { crmContactID: "contact-1", description: "" }) {
          crmActivityOrError {
            ... on CreateCRMActivityNoteFailure { mutationError { message } }
          }
        }
      }`,
      { createCrmActivityLoader }
    )

    expect(
      result.createCRMActivityNote.crmActivityOrError.mutationError.message
    ).toBeDefined()
  })

  it("updates a note", async () => {
    const updateCrmActivityLoader = jest.fn().mockResolvedValue({
      ...note,
      subject: "Edited subject",
      description: "Edited",
    })

    const result = await runAuthenticatedQuery(
      `mutation {
        updateCRMActivityNote(input: { id: "activity-1", subject: "Edited subject", description: "Edited" }) {
          crmActivityOrError {
            ... on UpdateCRMActivityNoteSuccess { crmActivity { subject description } }
          }
        }
      }`,
      { updateCrmActivityLoader }
    )

    expect(updateCrmActivityLoader).toHaveBeenCalledWith("activity-1", {
      subject: "Edited subject",
      description: "Edited",
      occurred_at: undefined,
    })
    expect(result.updateCRMActivityNote.crmActivityOrError).toEqual({
      crmActivity: { subject: "Edited subject", description: "Edited" },
    })
  })

  it("deletes a note", async () => {
    const deleteCrmActivityLoader = jest.fn().mockResolvedValue(note)

    const result = await runAuthenticatedQuery(
      `mutation {
        deleteCRMActivityNote(input: { id: "activity-1" }) {
          crmActivityOrError {
            ... on DeleteCRMActivityNoteSuccess { crmActivity { internalID } }
          }
        }
      }`,
      { deleteCrmActivityLoader }
    )

    expect(deleteCrmActivityLoader).toHaveBeenCalledWith("activity-1")
    expect(result.deleteCRMActivityNote.crmActivityOrError).toEqual({
      crmActivity: { internalID: "activity-1" },
    })
  })
})
