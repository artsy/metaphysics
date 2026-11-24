import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const gravityList = {
  id: "list-1",
  partner_id: "partner-1",
  name: "VIP",
  description: "Top buyers",
  contacts_count: 3,
  created_by_id: "user-1",
  created_at: "2026-11-24T10:00:00Z",
  updated_at: "2026-11-24T11:00:00Z",
}

describe("crmContactList", () => {
  it("returns the list", async () => {
    const crmContactListLoader = jest.fn().mockResolvedValue(gravityList)

    const {
      crmContactList,
    } = await runAuthenticatedQuery(
      `{ crmContactList(id: "list-1") { internalID name description contactsCount partnerID } }`,
      { crmContactListLoader }
    )

    expect(crmContactListLoader).toHaveBeenCalledWith("list-1")
    expect(crmContactList).toEqual({
      internalID: "list-1",
      name: "VIP",
      description: "Top buyers",
      contactsCount: 3,
      partnerID: "partner-1",
    })
  })
})

describe("crmContactList when missing", () => {
  it("returns null for a 404", async () => {
    const crmContactListLoader = jest
      .fn()
      .mockRejectedValue(new HTTPError("Not Found", 404))

    const {
      crmContactList,
    } = await runAuthenticatedQuery(
      `{ crmContactList(id: "gone") { internalID } }`,
      { crmContactListLoader }
    )

    expect(crmContactList).toBeNull()
  })
})

describe("crmContactListsConnection", () => {
  it("passes the partner and sort to Gravity and paginates", async () => {
    const crmContactListsLoader = jest.fn().mockResolvedValue({
      body: [gravityList],
      headers: { "x-total-count": "1" },
    })

    const { crmContactListsConnection } = await runAuthenticatedQuery(
      `{
        crmContactListsConnection(partnerID: "partner-1", first: 4, sort: UPDATED_AT_DESC) {
          totalCount
          edges { node { internalID name } }
        }
      }`,
      { crmContactListsLoader }
    )

    expect(crmContactListsLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
      sort: "-updated_at",
      total_count: true,
      size: 4,
      offset: 0,
    })
    expect(crmContactListsConnection.totalCount).toEqual(1)
    expect(crmContactListsConnection.edges[0].node).toEqual({
      internalID: "list-1",
      name: "VIP",
    })
  })
})

describe("crmContactsConnection list filters and CRMContact.lists", () => {
  it("passes list params and returns embedded lists", async () => {
    const crmContactsLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "contact-1",
          partner_id: "partner-1",
          lists: [{ id: "list-1", name: "VIP" }],
        },
      ],
      headers: { "x-total-count": "1" },
    })

    const { crmContactsConnection } = await runAuthenticatedQuery(
      `{
        crmContactsConnection(partnerID: "partner-1", first: 10, listID: "list-1", listIDs: ["list-2"], excludeListIDs: ["list-3"]) {
          edges { node { lists { internalID name } } }
        }
      }`,
      { crmContactsLoader }
    )

    expect(crmContactsLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        list_id: "list-1",
        list_ids: ["list-2"],
        exclude_list_ids: ["list-3"],
      })
    )
    expect(crmContactsConnection.edges[0].node.lists).toEqual([
      { internalID: "list-1", name: "VIP" },
    ])
  })

  it("leaves out empty list params", async () => {
    const crmContactsLoader = jest
      .fn()
      .mockResolvedValue({ body: [], headers: { "x-total-count": "0" } })

    await runAuthenticatedQuery(
      `{ crmContactsConnection(partnerID: "partner-1", first: 10, listIDs: []) { totalCount } }`,
      { crmContactsLoader }
    )

    const params = crmContactsLoader.mock.calls[0][0]
    expect(params).not.toHaveProperty("list_ids")
    expect(params).not.toHaveProperty("list_id")
  })
})

describe("CRM contact list mutations", () => {
  const listFields = `
    crmContactListOrError {
      __typename
      ... on CreateCRMContactListSuccess { crmContactList { internalID } }
      ... on CreateCRMContactListFailure { mutationError { message statusCode } }
    }
  `

  it("creates a list with contacts", async () => {
    const createCrmContactListLoader = jest.fn().mockResolvedValue(gravityList)

    const { createCRMContactList } = await runAuthenticatedQuery(
      `mutation {
        createCRMContactList(input: { partnerID: "partner-1", name: "VIP", description: "Top", contactIDs: ["c-1"] }) {
          ${listFields}
        }
      }`,
      { createCrmContactListLoader }
    )

    expect(createCrmContactListLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
      name: "VIP",
      description: "Top",
      crm_contact_ids: ["c-1"],
    })
    expect(createCRMContactList.crmContactListOrError).toEqual({
      __typename: "CreateCRMContactListSuccess",
      crmContactList: { internalID: "list-1" },
    })
  })

  it("returns a failure for a duplicate name", async () => {
    const createCrmContactListLoader = jest.fn().mockRejectedValue(
      new HTTPError("Gravity error", 400, {
        type: "param_error",
        message: "Name has already been taken",
      } as any)
    )

    const { createCRMContactList } = await runAuthenticatedQuery(
      `mutation {
        createCRMContactList(input: { partnerID: "partner-1", name: "VIP" }) {
          ${listFields}
        }
      }`,
      { createCrmContactListLoader }
    )

    expect(createCRMContactList.crmContactListOrError.__typename).toEqual(
      "CreateCRMContactListFailure"
    )
    expect(
      createCRMContactList.crmContactListOrError.mutationError.statusCode
    ).toEqual(400)
  })

  it("updates, deletes, adds and removes contacts", async () => {
    const context = {
      updateCrmContactListLoader: jest.fn().mockResolvedValue(gravityList),
      deleteCrmContactListLoader: jest.fn().mockResolvedValue(gravityList),
      addCrmContactsToListLoader: jest.fn().mockResolvedValue(gravityList),
      removeCrmContactsFromListLoader: jest.fn().mockResolvedValue(gravityList),
    }

    await runAuthenticatedQuery(
      `mutation {
        updateCRMContactList(input: { id: "list-1", name: "Top" }) { clientMutationId }
        deleteCRMContactList(input: { id: "list-1" }) { clientMutationId }
        addCRMContactsToList(input: { id: "list-1", contactIDs: ["c-1"] }) { clientMutationId }
        removeCRMContactsFromList(input: { id: "list-1", contactIDs: ["c-2"] }) { clientMutationId }
      }`,
      context
    )

    expect(context.updateCrmContactListLoader).toHaveBeenCalledWith("list-1", {
      name: "Top",
      description: undefined,
    })
    expect(context.deleteCrmContactListLoader).toHaveBeenCalledWith("list-1")
    expect(context.addCrmContactsToListLoader).toHaveBeenCalledWith("list-1", {
      crm_contact_ids: ["c-1"],
    })
    expect(
      context.removeCrmContactsFromListLoader
    ).toHaveBeenCalledWith("list-1", { crm_contact_ids: ["c-2"] })
  })

  it.each([
    [
      "updateCRMContactList",
      "updateCrmContactListLoader",
      `id: "list-1", name: "VIP"`,
    ],
    ["deleteCRMContactList", "deleteCrmContactListLoader", `id: "list-1"`],
    [
      "addCRMContactsToList",
      "addCrmContactsToListLoader",
      `id: "list-1", contactIDs: ["c-1"]`,
    ],
    [
      "removeCRMContactsFromList",
      "removeCrmContactsFromListLoader",
      `id: "list-1", contactIDs: ["c-1"]`,
    ],
  ])(
    "%s returns a failure when Gravity rejects it",
    async (field, loader, input) => {
      const typeName = field.charAt(0).toUpperCase() + field.slice(1)
      const context = {
        [loader]: jest
          .fn()
          .mockRejectedValue(
            new HTTPError("Gravity error", 404, { error: "Not Found" } as any)
          ),
      }

      const result = await runAuthenticatedQuery(
        `mutation {
        ${field}(input: { ${input} }) {
          crmContactListOrError {
            __typename
            ... on ${typeName}Failure { mutationError { statusCode } }
          }
        }
      }`,
        context
      )

      expect(result[field].crmContactListOrError).toEqual({
        __typename: `${typeName}Failure`,
        mutationError: { statusCode: 404 },
      })
    }
  )

  it("rejects adding or removing an empty list of contacts", async () => {
    const addCrmContactsToListLoader = jest.fn()

    await expect(
      runAuthenticatedQuery(
        `mutation {
          addCRMContactsToList(input: { id: "list-1", contactIDs: [] }) {
            clientMutationId
          }
        }`,
        { addCrmContactsToListLoader }
      )
    ).rejects.toThrow("contactIDs must include at least one ID")
    expect(addCrmContactsToListLoader).not.toHaveBeenCalled()
  })
})
