import { runAuthenticatedQuery } from "schema/v2/test/utils"

const presets = [
  {
    key: "viewer",
    display_name: "Viewer",
    description: "Can view everything.",
    permissions: ["catalog:read"],
  },
  {
    key: "editor",
    display_name: "Editor",
    description: "Can edit everything.",
    permissions: ["catalog:read", "catalog:write"],
  },
]

describe("Partner.permissionGrantsConnection", () => {
  const query = `
    {
      partner(id: "partner-1") {
        permissionGrantsConnection(first: 10) {
          totalCount
          edges {
            node {
              internalID
              user { internalID name email }
              grantedBy { name }
              preset { key displayName }
              effectivePermissions
            }
          }
        }
      }
    }
  `

  it("returns grants with their users and presets", async () => {
    const partnerPermissionPresetsLoader = jest.fn().mockResolvedValue(presets)
    const partnerPermissionGrantsLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "grant-1",
          partner_id: "partner-1",
          preset_key: "editor",
          effective_permissions: ["catalog:read", "catalog:write"],
          user: { id: "user-1", name: "Ada", email: "ada@example.com" },
          granted_by: {
            id: "user-2",
            name: "Grace",
            email: "grace@example.com",
          },
        },
        {
          id: "grant-2",
          partner_id: "partner-1",
          preset_key: "viewer",
          effective_permissions: ["catalog:read"],
          user: { id: "user-3", name: "Alan", email: "alan@example.com" },
          granted_by: null,
        },
      ],
      headers: { "x-total-count": "2" },
    })

    const result = await runAuthenticatedQuery(query, {
      partnerLoader: jest.fn().mockResolvedValue({ id: "partner-1" }),
      partnerPermissionGrantsLoader,
      partnerPermissionPresetsLoader,
    })

    const connection = result.partner.permissionGrantsConnection
    expect(connection.totalCount).toEqual(2)
    expect(connection.edges[0].node).toEqual({
      internalID: "grant-1",
      user: { internalID: "user-1", name: "Ada", email: "ada@example.com" },
      grantedBy: { name: "Grace" },
      preset: { key: "editor", displayName: "Editor" },
      effectivePermissions: ["catalog:read", "catalog:write"],
    })
    expect(connection.edges[1].node.grantedBy).toBeNull()
    expect(partnerPermissionGrantsLoader).toHaveBeenCalledWith(
      expect.objectContaining({ partner_id: "partner-1", total_count: true })
    )
    expect(partnerPermissionPresetsLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
    })
  })
})

describe("partnerPermissionPresets", () => {
  it("returns the presets for a partner", async () => {
    const partnerPermissionPresetsLoader = jest.fn().mockResolvedValue(presets)

    const result = await runAuthenticatedQuery(
      `{ partnerPermissionPresets(partnerID: "partner-1") { key displayName permissions } }`,
      { partnerPermissionPresetsLoader }
    )

    expect(partnerPermissionPresetsLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
    })
    expect(result.partnerPermissionPresets[0]).toEqual({
      key: "viewer",
      displayName: "Viewer",
      permissions: ["catalog:read"],
    })
  })
})

describe("Me ArtOS access", () => {
  it("returns the current user's permissions for a partner", async () => {
    const mePartnerPermissionsLoader = jest
      .fn()
      .mockResolvedValue({ permissions: ["catalog:read"], source: "grant" })

    const result = await runAuthenticatedQuery(
      `{ me { artosPermissions(partnerID: "partner-1") { permissions source } } }`,
      {
        meLoader: jest.fn().mockResolvedValue({ id: "me" }),
        mePartnerPermissionsLoader,
      }
    )

    expect(mePartnerPermissionsLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
    })
    expect(result.me.artosPermissions).toEqual({
      permissions: ["catalog:read"],
      source: "GRANT",
    })
  })

  it("lists the partners the user holds grants for, in one call", async () => {
    const partnersLoader = jest.fn().mockResolvedValue({
      body: [
        { _id: "partner-1", id: "partner-1", name: "Gallery One" },
        { _id: "partner-2", id: "partner-2", name: "Gallery Two" },
      ],
    })

    const result = await runAuthenticatedQuery(
      `{ me { artosPartners { internalID name } } }`,
      {
        meLoader: jest.fn().mockResolvedValue({ id: "me" }),
        mePartnerPermissionGrantsLoader: jest
          .fn()
          .mockResolvedValue([
            { partner_id: "partner-1" },
            { partner_id: "partner-2" },
          ]),
        partnersLoader,
      }
    )

    expect(partnersLoader).toHaveBeenCalledWith({
      id: ["partner-1", "partner-2"],
      size: 2,
    })
    expect(result.me.artosPartners).toEqual([
      { internalID: "partner-1", name: "Gallery One" },
      { internalID: "partner-2", name: "Gallery Two" },
    ])
  })

  it("lists no partners for a user without grants", async () => {
    const partnersLoader = jest.fn()

    const result = await runAuthenticatedQuery(
      `{ me { artosPartners { internalID } } }`,
      {
        meLoader: jest.fn().mockResolvedValue({ id: "me" }),
        mePartnerPermissionGrantsLoader: jest.fn().mockResolvedValue([]),
        partnersLoader,
      }
    )

    expect(result.me.artosPartners).toEqual([])
    expect(partnersLoader).not.toHaveBeenCalled()
  })
})
