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
        createCRMActivity(input: { crmContactID: "contact-1", kind: NOTE, occurredAt: "2026-01-02T10:00:00Z", subject: "Fair", description: "Met at the fair" }) {
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
      occurred_at: "2026-01-02T10:00:00Z",
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

  it("updates the kind and artworks, and clears them with an empty list", async () => {
    const updateCrmActivityLoader = jest.fn().mockResolvedValue(activity)

    await runAuthenticatedQuery(
      `mutation {
        updateCRMActivity(input: { id: "activity-1", kind: MEETING, artworkIDs: [], artistIDs: [] }) {
          crmActivityOrError {
            ... on UpdateCRMActivitySuccess { crmActivity { internalID } }
          }
        }
      }`,
      { updateCrmActivityLoader }
    )

    expect(updateCrmActivityLoader).toHaveBeenCalledWith("activity-1", {
      artist_ids: [],
      artwork_ids: [],
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
