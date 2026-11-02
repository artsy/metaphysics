import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"
import { toQueryString } from "lib/helpers"
import { constructUrlAndParams } from "lib/apis/fetch"

const contact = {
  id: "contact-1",
  partner_id: "partner-1",
  contact_type: "person",
  display_name: "Ada Lovelace",
  status: "active",
}

const gravityError = (statusCode: number, body: Record<string, unknown>) =>
  new HTTPError("Gravity error", statusCode, body as any)

describe("createCRMContact", () => {
  const mutation = `
    mutation {
      createCRMContact(input: {
        partnerID: "partner-1"
        contactType: PERSON
        firstName: "Ada"
        categories: ["collector"]
        emails: [{ address: "ada@example.com", isPrimary: true }]
        locations: [{ countryCode: "GB", cityName: "London" }]
      }) {
        crmContactOrError {
          __typename
          ... on CreateCRMContactSuccess {
            crmContact { internalID displayName }
          }
          ... on CreateCRMContactFailure {
            mutationError { message statusCode }
          }
        }
      }
    }
  `

  it("passes snake_cased params to Gravity", async () => {
    const createCrmContactLoader = jest.fn().mockResolvedValue(contact)

    await runAuthenticatedQuery(mutation, { createCrmContactLoader })

    expect(createCrmContactLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
      contact_type: "person",
      first_name: "Ada",
      last_name: undefined,
      company: undefined,
      phone: undefined,
      categories: ["collector"],
      notes: undefined,
      assigned_to_user_id: undefined,
      emails: [{ address: "ada@example.com", is_primary: true }],
      locations: [
        { country_code: "GB", city_name: "London", is_primary: undefined },
      ],
    })
  })

  it("returns the created contact", async () => {
    const result = await runAuthenticatedQuery(mutation, {
      createCrmContactLoader: jest.fn().mockResolvedValue(contact),
    })

    expect(result.createCRMContact.crmContactOrError).toEqual({
      __typename: "CreateCRMContactSuccess",
      crmContact: { internalID: "contact-1", displayName: "Ada Lovelace" },
    })
  })

  it("returns a failure when Gravity rejects the request", async () => {
    const result = await runAuthenticatedQuery(mutation, {
      createCrmContactLoader: jest.fn().mockRejectedValue(
        gravityError(400, {
          type: "param_error",
          message: "ada@example.com is already used by contact Ada Lovelace",
        })
      ),
    })

    expect(result.createCRMContact.crmContactOrError).toEqual({
      __typename: "CreateCRMContactFailure",
      mutationError: {
        message: "ada@example.com is already used by contact Ada Lovelace",
        statusCode: 400,
      },
    })
  })
})

describe("updateCRMContact", () => {
  const mutation = `
    mutation {
      updateCRMContact(input: { id: "contact-1", lastName: "King", notes: null }) {
        crmContactOrError {
          __typename
          ... on UpdateCRMContactSuccess { crmContact { internalID } }
        }
      }
    }
  `

  it("sends only what the client provided, including explicit nulls", async () => {
    const updateCrmContactLoader = jest.fn().mockResolvedValue(contact)

    const result = await runAuthenticatedQuery(mutation, {
      updateCrmContactLoader,
    })

    expect(updateCrmContactLoader).toHaveBeenCalledWith("contact-1", {
      contact_type: undefined,
      first_name: undefined,
      last_name: "King",
      company: undefined,
      phone: undefined,
      categories: undefined,
      notes: null,
      assigned_to_user_id: undefined,
    })
    expect(result.updateCRMContact.crmContactOrError.__typename).toEqual(
      "UpdateCRMContactSuccess"
    )
  })
})

describe("updateCRMContact with an empty categories list", () => {
  const mutation = `
    mutation {
      updateCRMContact(input: { id: "contact-1", categories: [] }) {
        crmContactOrError { __typename }
      }
    }
  `

  it("sends null so that categories are cleared", async () => {
    const updateCrmContactLoader = jest.fn().mockResolvedValue(contact)

    await runAuthenticatedQuery(mutation, { updateCrmContactLoader })

    expect(updateCrmContactLoader).toHaveBeenCalledWith(
      "contact-1",
      expect.objectContaining({ categories: null })
    )
  })

  it("reaches Gravity as a null in the request body", async () => {
    const updateCrmContactLoader = jest.fn().mockResolvedValue(contact)

    await runAuthenticatedQuery(mutation, { updateCrmContactLoader })

    // Loaders serialize params into a query string, then rebuild a JSON body
    // from it, so check the real round trip rather than the mocked loader.
    const [, params] = updateCrmContactLoader.mock.calls[0]
    const { body } = constructUrlAndParams(
      "PUT",
      `crm_contact/contact-1?${toQueryString(params)}`
    )

    expect(body).toHaveProperty("categories", null)
  })
})

describe("archiveCRMContact and unarchiveCRMContact", () => {
  it("archives a contact", async () => {
    const archiveCrmContactLoader = jest
      .fn()
      .mockResolvedValue({ ...contact, status: "archived" })

    const result = await runAuthenticatedQuery(
      `mutation {
        archiveCRMContact(input: { id: "contact-1" }) {
          crmContactOrError {
            ... on ArchiveCRMContactSuccess { crmContact { status } }
          }
        }
      }`,
      { archiveCrmContactLoader }
    )

    expect(archiveCrmContactLoader).toHaveBeenCalledWith("contact-1")
    expect(result.archiveCRMContact.crmContactOrError).toEqual({
      crmContact: { status: "ARCHIVED" },
    })
  })

  it("unarchives a contact", async () => {
    const unarchiveCrmContactLoader = jest.fn().mockResolvedValue(contact)

    const result = await runAuthenticatedQuery(
      `mutation {
        unarchiveCRMContact(input: { id: "contact-1" }) {
          crmContactOrError {
            ... on UnarchiveCRMContactSuccess { crmContact { status } }
          }
        }
      }`,
      { unarchiveCrmContactLoader }
    )

    expect(unarchiveCrmContactLoader).toHaveBeenCalledWith("contact-1")
    expect(result.unarchiveCRMContact.crmContactOrError).toEqual({
      crmContact: { status: "ACTIVE" },
    })
  })
})
