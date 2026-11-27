import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const grant = {
  id: "grant-1",
  partner_id: "partner-1",
  preset_key: "editor",
  permissions: null,
  effective_permissions: ["catalog:read", "catalog:write"],
  user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com" },
  granted_by: {
    id: "user-2",
    name: "Grace Hopper",
    email: "grace@example.com",
  },
}

const grantFields = (name: string) => `
  partnerPermissionGrantOrError {
    ... on ${name}Success {
      partnerPermissionGrant { internalID presetKey user { name } }
    }
    ... on ${name}Failure { mutationError { message } }
  }
`

describe("createPartnerPermissionGrant", () => {
  const mutation = `
    mutation {
      createPartnerPermissionGrant(input: { partnerID: "partner-1", userID: "user-1", presetKey: "editor" }) {
        ${grantFields("CreatePartnerPermissionGrant")}
      }
    }
  `

  it("passes snake_cased args to Gravity and returns the grant", async () => {
    const createPartnerPermissionGrantLoader = jest
      .fn()
      .mockResolvedValue(grant)

    const result = await runAuthenticatedQuery(mutation, {
      createPartnerPermissionGrantLoader,
    })

    expect(createPartnerPermissionGrantLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
      user_id: "user-1",
      preset_key: "editor",
      permissions: undefined,
    })
    expect(
      result.createPartnerPermissionGrant.partnerPermissionGrantOrError
        .partnerPermissionGrant
    ).toEqual({
      internalID: "grant-1",
      presetKey: "editor",
      user: { name: "Ada Lovelace" },
    })
  })

  it("returns Gravity's validation error", async () => {
    const error = new HTTPError("http://artsy.net - {}", 400, {
      type: "param_error",
      message: "User already has access to this partner",
      detail: {},
    })

    const result = await runAuthenticatedQuery(mutation, {
      createPartnerPermissionGrantLoader: jest.fn().mockRejectedValue(error),
    })

    expect(
      result.createPartnerPermissionGrant.partnerPermissionGrantOrError
        .mutationError.message
    ).toEqual("User already has access to this partner")
  })
})

describe("updatePartnerPermissionGrant", () => {
  it("sends the grant id and new permissions", async () => {
    const updatePartnerPermissionGrantLoader = jest
      .fn()
      .mockResolvedValue({ ...grant, preset_key: "viewer" })

    const result = await runAuthenticatedQuery(
      `mutation {
        updatePartnerPermissionGrant(input: { grantID: "grant-1", presetKey: "viewer" }) { ${grantFields(
          "UpdatePartnerPermissionGrant"
        )} }
      }`,
      { updatePartnerPermissionGrantLoader }
    )

    expect(updatePartnerPermissionGrantLoader).toHaveBeenCalledWith("grant-1", {
      preset_key: "viewer",
      permissions: undefined,
    })
    expect(
      result.updatePartnerPermissionGrant.partnerPermissionGrantOrError
        .partnerPermissionGrant.presetKey
    ).toEqual("viewer")
  })
})

describe("deletePartnerPermissionGrant", () => {
  it("deletes the grant", async () => {
    const deletePartnerPermissionGrantLoader = jest
      .fn()
      .mockResolvedValue(grant)

    const result = await runAuthenticatedQuery(
      `mutation {
        deletePartnerPermissionGrant(input: { grantID: "grant-1" }) { ${grantFields(
          "DeletePartnerPermissionGrant"
        )} }
      }`,
      { deletePartnerPermissionGrantLoader }
    )

    expect(deletePartnerPermissionGrantLoader).toHaveBeenCalledWith("grant-1")
    expect(
      result.deletePartnerPermissionGrant.partnerPermissionGrantOrError
        .partnerPermissionGrant.internalID
    ).toEqual("grant-1")
  })
})

describe("enableArtOSForPartner", () => {
  it("returns how many grants were created and users skipped", async () => {
    const enableArtOSForPartnerLoader = jest.fn().mockResolvedValue({
      created_grant_ids: ["grant-1", "grant-2"],
      skipped_user_ids: ["user-3"],
    })

    const result = await runAuthenticatedQuery(
      `mutation {
        enableArtOSForPartner(input: { partnerID: "partner-1" }) {
          enablementOrError {
            ... on EnableArtOSForPartnerSuccess { enablement { createdGrantsCount skippedUsersCount } }
          }
        }
      }`,
      { enableArtOSForPartnerLoader }
    )

    expect(enableArtOSForPartnerLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
    })
    expect(result.enableArtOSForPartner.enablementOrError.enablement).toEqual({
      createdGrantsCount: 2,
      skippedUsersCount: 1,
    })
  })
})
