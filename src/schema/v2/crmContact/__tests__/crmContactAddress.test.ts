import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const address = {
  id: "address-1",
  crm_contact_id: "contact-1",
  partner_id: "partner-1",
  address_type: "shipping",
  address_line_1: "401 Broadway",
  address_line_2: null,
  city: "New York",
  region: "NY",
  postal_code: "10013",
  country: "US",
}

describe("CRM contact addresses", () => {
  it("returns an address", async () => {
    const crmContactAddressLoader = jest.fn().mockResolvedValue(address)

    const result = await runAuthenticatedQuery(
      `{
        crmContactAddress(id: "address-1") {
          internalID addressType addressLine1 addressLine2 city region postalCode country
        }
      }`,
      { crmContactAddressLoader }
    )

    expect(crmContactAddressLoader).toHaveBeenCalledWith("address-1")
    expect(result.crmContactAddress).toEqual({
      internalID: "address-1",
      addressType: "SHIPPING",
      addressLine1: "401 Broadway",
      addressLine2: null,
      city: "New York",
      region: "NY",
      postalCode: "10013",
      country: "US",
    })
  })

  it("passes params to the loader and returns the connection", async () => {
    const crmContactAddressesLoader = jest.fn().mockResolvedValue({
      body: [address],
      headers: { "x-total-count": "1" },
    })

    const result = await runAuthenticatedQuery(
      `{
        crmContactAddressesConnection(crmContactID: "contact-1", first: 5) {
          totalCount
          edges { node { city } }
        }
      }`,
      { crmContactAddressesLoader }
    )

    expect(crmContactAddressesLoader).toHaveBeenCalledWith({
      crm_contact_id: "contact-1",
      sort: undefined,
      total_count: true,
      size: 5,
      offset: 0,
    })
    expect(result.crmContactAddressesConnection).toEqual({
      totalCount: 1,
      edges: [{ node: { city: "New York" } }],
    })
  })

  it("exposes the addresses embedded in a contact without extra loader calls", async () => {
    const crmContactLoader = jest.fn().mockResolvedValue({
      id: "contact-1",
      partner_id: "partner-1",
      contact_type: "person",
      status: "active",
      addresses: [address],
    })
    const crmContactAddressesLoader = jest.fn()

    const result = await runAuthenticatedQuery(
      `{ crmContact(id: "contact-1") { addresses { addressType city } } }`,
      { crmContactLoader, crmContactAddressesLoader }
    )

    expect(result.crmContact.addresses).toEqual([
      { addressType: "SHIPPING", city: "New York" },
    ])
    expect(crmContactAddressesLoader).not.toHaveBeenCalled()
  })
})

describe("CRM contact address mutations", () => {
  it("saves an address", async () => {
    const saveCrmContactAddressLoader = jest.fn().mockResolvedValue(address)

    const result = await runAuthenticatedQuery(
      `mutation {
        saveCRMContactAddress(input: {
          crmContactID: "contact-1", addressType: SHIPPING, addressLine1: "401 Broadway",
          city: "New York", postalCode: "10013", country: "US"
        }) {
          crmContactAddressOrError {
            ... on SaveCRMContactAddressSuccess { crmContactAddress { internalID addressType } }
          }
        }
      }`,
      { saveCrmContactAddressLoader }
    )

    expect(saveCrmContactAddressLoader).toHaveBeenCalledWith({
      crm_contact_id: "contact-1",
      address_type: "shipping",
      address_line_1: "401 Broadway",
      address_line_2: undefined,
      city: "New York",
      region: undefined,
      postal_code: "10013",
      country: "US",
    })
    expect(result.saveCRMContactAddress.crmContactAddressOrError).toEqual({
      crmContactAddress: { internalID: "address-1", addressType: "SHIPPING" },
    })
  })

  it("updates an address", async () => {
    const updateCrmContactAddressLoader = jest.fn().mockResolvedValue(address)

    await runAuthenticatedQuery(
      `mutation {
        updateCRMContactAddress(input: { id: "address-1", city: "Brooklyn", addressLine2: "" }) {
          crmContactAddressOrError { __typename }
        }
      }`,
      { updateCrmContactAddressLoader }
    )

    expect(updateCrmContactAddressLoader).toHaveBeenCalledWith("address-1", {
      address_line_1: undefined,
      address_line_2: "",
      city: "Brooklyn",
      region: undefined,
      postal_code: undefined,
      country: undefined,
    })
  })

  it("deletes an address", async () => {
    const deleteCrmContactAddressLoader = jest.fn().mockResolvedValue(address)

    const result = await runAuthenticatedQuery(
      `mutation {
        deleteCRMContactAddress(input: { id: "address-1" }) {
          crmContactAddressOrError {
            ... on DeleteCRMContactAddressSuccess { crmContactAddress { internalID } }
          }
        }
      }`,
      { deleteCrmContactAddressLoader }
    )

    expect(deleteCrmContactAddressLoader).toHaveBeenCalledWith("address-1")
    expect(result.deleteCRMContactAddress.crmContactAddressOrError).toEqual({
      crmContactAddress: { internalID: "address-1" },
    })
  })

  it("returns Gravity validation errors as a failure", async () => {
    const saveCrmContactAddressLoader = jest.fn().mockRejectedValue(
      new HTTPError("Bad Request", 400, {
        type: "error",
        message: "Country is invalid",
      } as any)
    )

    const result = await runAuthenticatedQuery(
      `mutation {
        saveCRMContactAddress(input: {
          crmContactID: "contact-1", addressType: HOME, addressLine1: "x",
          city: "y", postalCode: "z", country: "ZZ"
        }) {
          crmContactAddressOrError {
            ... on SaveCRMContactAddressFailure { mutationError { message } }
          }
        }
      }`,
      { saveCrmContactAddressLoader }
    )

    expect(
      result.saveCRMContactAddress.crmContactAddressOrError.mutationError
        .message
    ).toContain("Country is invalid")
  })
})
