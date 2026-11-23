import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const activity = {
  id: "activity-1",
  crm_contact_id: "contact-1",
  partner_id: "partner-1",
  channel: "in_person",
  kind: "note",
  subject: "Fair",
  description: "Met at the fair",
}

describe("CRM activity mutations", () => {
  it("creates an activity", async () => {
    const createCrmActivityLoader = jest.fn().mockResolvedValue(activity)

    const result = await runAuthenticatedQuery(
      `mutation {
        createCRMActivity(input: { crmContactID: "contact-1", channel: IN_PERSON, kind: NOTE, occurredAt: "2026-01-02T10:00:00Z", subject: "Fair", description: "Met at the fair" }) {
          crmActivityOrError {
            ... on CreateCRMActivitySuccess { crmActivity { internalID channel kind subject description } }
          }
        }
      }`,
      { createCrmActivityLoader }
    )

    expect(createCrmActivityLoader).toHaveBeenCalledWith({
      channel: "in_person",
      crm_contact_id: "contact-1",
      description: "Met at the fair",
      kind: "note",
      occurred_at: "2026-01-02T10:00:00Z",
      subject: "Fair",
    })
    expect(result.createCRMActivity.crmActivityOrError).toEqual({
      crmActivity: {
        internalID: "activity-1",
        channel: "IN_PERSON",
        kind: "NOTE",
        subject: "Fair",
        description: "Met at the fair",
      },
    })
  })

  it("sends the user who added the activity on create, and null to leave it unset", async () => {
    const createCrmActivityLoader = jest
      .fn()
      .mockResolvedValue({ ...activity, user_id: "user-1" })

    const result = await runAuthenticatedQuery(
      `mutation {
        createCRMActivity(input: { crmContactID: "contact-1", kind: NOTE, description: "Hi", userID: "user-1" }) {
          crmActivityOrError {
            ... on CreateCRMActivitySuccess { crmActivity { userID } }
          }
        }
      }`,
      { createCrmActivityLoader }
    )

    expect(createCrmActivityLoader).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1" })
    )
    expect(result.createCRMActivity.crmActivityOrError).toEqual({
      crmActivity: { userID: "user-1" },
    })

    await runAuthenticatedQuery(
      `mutation {
        createCRMActivity(input: { crmContactID: "contact-1", kind: NOTE, description: "Hi", userID: null }) {
          crmActivityOrError {
            ... on CreateCRMActivitySuccess { crmActivity { internalID } }
          }
        }
      }`,
      { createCrmActivityLoader }
    )

    expect(createCrmActivityLoader).toHaveBeenLastCalledWith(
      expect.objectContaining({ user_id: null })
    )
  })

  it("leaves user_id out of a create that does not send it", async () => {
    const createCrmActivityLoader = jest.fn().mockResolvedValue(activity)

    await runAuthenticatedQuery(
      `mutation {
        createCRMActivity(input: { crmContactID: "contact-1", kind: NOTE, description: "Hi" }) {
          crmActivityOrError {
            ... on CreateCRMActivitySuccess { crmActivity { internalID } }
          }
        }
      }`,
      { createCrmActivityLoader }
    )

    expect(createCrmActivityLoader.mock.calls[0][0].user_id).toBeUndefined()
  })

  it("changes the user on update, clears it with null, and keeps it when left out", async () => {
    const updateCrmActivityLoader = jest.fn().mockResolvedValue(activity)
    const run = (input: string) =>
      runAuthenticatedQuery(
        `mutation {
          updateCRMActivity(input: { id: "activity-1", ${input} }) {
            crmActivityOrError {
              ... on UpdateCRMActivitySuccess { crmActivity { internalID } }
            }
          }
        }`,
        { updateCrmActivityLoader }
      )

    await run('userID: "user-2"')
    expect(updateCrmActivityLoader).toHaveBeenLastCalledWith(
      "activity-1",
      expect.objectContaining({ user_id: "user-2" })
    )

    await run("userID: null")
    expect(updateCrmActivityLoader).toHaveBeenLastCalledWith(
      "activity-1",
      expect.objectContaining({ user_id: null })
    )

    await run('subject: "Edited"')
    expect(updateCrmActivityLoader.mock.calls[2][1].user_id).toBeUndefined()
  })

  it("creates an interest in artworks", async () => {
    const createCrmActivityLoader = jest
      .fn()
      .mockResolvedValue({ ...activity, kind: "interest" })

    const result = await runAuthenticatedQuery(
      `mutation {
        createCRMActivity(input: { crmContactID: "contact-1", kind: INTEREST, artworkIDs: ["artwork-1"] }) {
          crmActivityOrError {
            ... on CreateCRMActivitySuccess { crmActivity { kind } }
          }
        }
      }`,
      { createCrmActivityLoader }
    )

    expect(createCrmActivityLoader).toHaveBeenCalledWith({
      artwork_ids: ["artwork-1"],
      crm_contact_id: "contact-1",
      kind: "interest",
    })
    expect(result.createCRMActivity.crmActivityOrError).toEqual({
      crmActivity: { kind: "INTEREST" },
    })
  })

  it("creates an interest in an artist", async () => {
    const createCrmActivityLoader = jest
      .fn()
      .mockResolvedValue({ ...activity, kind: "interest" })

    await runAuthenticatedQuery(
      `mutation {
        createCRMActivity(input: { crmContactID: "contact-1", kind: INTEREST, artistIDs: ["artist-1"] }) {
          crmActivityOrError {
            ... on CreateCRMActivitySuccess { crmActivity { kind } }
          }
        }
      }`,
      { createCrmActivityLoader }
    )

    expect(createCrmActivityLoader).toHaveBeenCalledWith({
      artist_ids: ["artist-1"],
      crm_contact_id: "contact-1",
      kind: "interest",
    })
  })

  it("loads the artworks of a created activity", async () => {
    const createCrmActivityLoader = jest.fn().mockResolvedValue({
      ...activity,
      kind: "interest",
      links: [{ target_type: "artwork", target_id: "artwork-1" }],
    })
    const partnerArtworksAllLoader = jest.fn().mockResolvedValue({
      body: [{ _id: "artwork-1", id: "one", title: "One" }],
      headers: {},
    })

    const result = await runAuthenticatedQuery(
      `mutation {
        createCRMActivity(input: { crmContactID: "contact-1", kind: INTEREST, artworkIDs: ["artwork-1"] }) {
          crmActivityOrError {
            ... on CreateCRMActivitySuccess { crmActivity { artworks { internalID title } } }
          }
        }
      }`,
      { createCrmActivityLoader, partnerArtworksAllLoader }
    )

    expect(partnerArtworksAllLoader).toHaveBeenCalledWith("partner-1", {
      artwork_id: ["artwork-1"],
      include_non_artsy_listed: true,
      size: 1,
    })
    expect(result.createCRMActivity.crmActivityOrError).toEqual({
      crmActivity: { artworks: [{ internalID: "artwork-1", title: "One" }] },
    })
  })

  it("loads the artists of a created activity", async () => {
    const createCrmActivityLoader = jest.fn().mockResolvedValue({
      ...activity,
      kind: "interest",
      links: [{ target_type: "artist", target_id: "artist-1" }],
    })
    const partnerArtistsAllLoader = jest.fn().mockResolvedValue({
      body: [{ artist: { _id: "artist-1", id: "one", name: "One" } }],
      headers: {},
    })

    const result = await runAuthenticatedQuery(
      `mutation {
        createCRMActivity(input: { crmContactID: "contact-1", kind: INTEREST, artistIDs: ["artist-1"] }) {
          crmActivityOrError {
            ... on CreateCRMActivitySuccess { crmActivity { artists { internalID name } } }
          }
        }
      }`,
      { createCrmActivityLoader, partnerArtistsAllLoader }
    )

    expect(partnerArtistsAllLoader).toHaveBeenCalledTimes(1)
    expect(partnerArtistsAllLoader).toHaveBeenCalledWith("partner-1", {
      artist_ids: ["artist-1"],
      size: 1,
    })
    expect(result.createCRMActivity.crmActivityOrError).toEqual({
      crmActivity: { artists: [{ internalID: "artist-1", name: "One" }] },
    })
  })

  it("updates the kind and artworks, and clears them with null for an empty list", async () => {
    const updateCrmActivityLoader = jest.fn().mockResolvedValue(activity)

    await runAuthenticatedQuery(
      `mutation {
        updateCRMActivity(input: { id: "activity-1", channel: EMAIL, kind: MEETING, artworkIDs: [], artistIDs: [] }) {
          crmActivityOrError {
            ... on UpdateCRMActivitySuccess { crmActivity { internalID } }
          }
        }
      }`,
      { updateCrmActivityLoader }
    )

    expect(updateCrmActivityLoader).toHaveBeenCalledWith("activity-1", {
      artist_ids: null,
      artwork_ids: null,
      channel: "email",
      kind: "meeting",
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
        updateCRMActivity(input: { id: "activity-1", occurredAt: "2026-01-03T10:00:00Z", subject: "Edited subject", description: "Edited" }) {
          crmActivityOrError {
            ... on UpdateCRMActivitySuccess { crmActivity { subject description } }
          }
        }
      }`,
      { updateCrmActivityLoader }
    )

    expect(updateCrmActivityLoader).toHaveBeenCalledWith("activity-1", {
      description: "Edited",
      occurred_at: "2026-01-03T10:00:00Z",
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
