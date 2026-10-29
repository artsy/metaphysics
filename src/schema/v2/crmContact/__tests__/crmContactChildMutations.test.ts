import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const email = {
  id: "email-1",
  crm_contact_id: "contact-1",
  partner_id: "partner-1",
  address: "ada@example.com",
  is_primary: true,
}

const location = {
  id: "location-1",
  crm_contact_id: "contact-1",
  partner_id: "partner-1",
  country_code: "GB",
  city_name: "London",
  is_primary: true,
}

describe("CRM contact email mutations", () => {
  it("creates an email", async () => {
    const createCrmContactEmailLoader = jest.fn().mockResolvedValue(email)

    const result = await runAuthenticatedQuery(
      `mutation {
        createCRMContactEmail(input: { crmContactID: "contact-1", address: "ada@example.com", isPrimary: true }) {
          crmContactEmailOrError {
            ... on CreateCRMContactEmailSuccess { crmContactEmail { internalID address } }
          }
        }
      }`,
      { createCrmContactEmailLoader }
    )

    expect(createCrmContactEmailLoader).toHaveBeenCalledWith({
      crm_contact_id: "contact-1",
      address: "ada@example.com",
      is_primary: true,
    })
    expect(result.createCRMContactEmail.crmContactEmailOrError).toEqual({
      crmContactEmail: { internalID: "email-1", address: "ada@example.com" },
    })
  })

  it("updates an email", async () => {
    const updateCrmContactEmailLoader = jest.fn().mockResolvedValue(email)

    await runAuthenticatedQuery(
      `mutation {
        updateCRMContactEmail(input: { id: "email-1", isPrimary: true }) {
          crmContactEmailOrError { __typename }
        }
      }`,
      { updateCrmContactEmailLoader }
    )

    expect(updateCrmContactEmailLoader).toHaveBeenCalledWith("email-1", {
      address: undefined,
      is_primary: true,
    })
  })

  it("deletes an email", async () => {
    const deleteCrmContactEmailLoader = jest.fn().mockResolvedValue(email)

    const result = await runAuthenticatedQuery(
      `mutation {
        deleteCRMContactEmail(input: { id: "email-1" }) {
          crmContactEmailOrError {
            ... on DeleteCRMContactEmailSuccess { crmContactEmail { internalID } }
          }
        }
      }`,
      { deleteCrmContactEmailLoader }
    )

    expect(deleteCrmContactEmailLoader).toHaveBeenCalledWith("email-1")
    expect(result.deleteCRMContactEmail.crmContactEmailOrError).toEqual({
      crmContactEmail: { internalID: "email-1" },
    })
  })

  it("returns a failure on a concurrent primary change", async () => {
    const result = await runAuthenticatedQuery(
      `mutation {
        updateCRMContactEmail(input: { id: "email-1", isPrimary: true }) {
          crmContactEmailOrError {
            ... on UpdateCRMContactEmailFailure { mutationError { message statusCode } }
          }
        }
      }`,
      {
        updateCrmContactEmailLoader: jest.fn().mockRejectedValue(
          new HTTPError("Conflict", 409, {
            type: "error",
            message:
              "The primary was changed by another request. Please try again.",
          } as any)
        ),
      }
    )

    expect(result.updateCRMContactEmail.crmContactEmailOrError).toEqual({
      mutationError: {
        message:
          "The primary was changed by another request. Please try again.",
        statusCode: 409,
      },
    })
  })
})

describe("CRM contact location mutations", () => {
  it("creates a location", async () => {
    const createCrmContactLocationLoader = jest.fn().mockResolvedValue(location)

    const result = await runAuthenticatedQuery(
      `mutation {
        createCRMContactLocation(input: { crmContactID: "contact-1", countryCode: "GB", cityName: "London" }) {
          crmContactLocationOrError {
            ... on CreateCRMContactLocationSuccess { crmContactLocation { internalID cityName } }
          }
        }
      }`,
      { createCrmContactLocationLoader }
    )

    expect(createCrmContactLocationLoader).toHaveBeenCalledWith({
      crm_contact_id: "contact-1",
      country_code: "GB",
      city_name: "London",
      is_primary: undefined,
    })
    expect(result.createCRMContactLocation.crmContactLocationOrError).toEqual({
      crmContactLocation: { internalID: "location-1", cityName: "London" },
    })
  })

  it("updates a location", async () => {
    const updateCrmContactLocationLoader = jest.fn().mockResolvedValue(location)

    await runAuthenticatedQuery(
      `mutation {
        updateCRMContactLocation(input: { id: "location-1", cityName: "" }) {
          crmContactLocationOrError { __typename }
        }
      }`,
      { updateCrmContactLocationLoader }
    )

    expect(updateCrmContactLocationLoader).toHaveBeenCalledWith("location-1", {
      country_code: undefined,
      city_name: "",
      is_primary: undefined,
    })
  })

  it("deletes a location", async () => {
    const deleteCrmContactLocationLoader = jest.fn().mockResolvedValue(location)

    const result = await runAuthenticatedQuery(
      `mutation {
        deleteCRMContactLocation(input: { id: "location-1" }) {
          crmContactLocationOrError {
            ... on DeleteCRMContactLocationSuccess { crmContactLocation { internalID } }
          }
        }
      }`,
      { deleteCrmContactLocationLoader }
    )

    expect(deleteCrmContactLocationLoader).toHaveBeenCalledWith("location-1")
    expect(result.deleteCRMContactLocation.crmContactLocationOrError).toEqual({
      crmContactLocation: { internalID: "location-1" },
    })
  })
})
