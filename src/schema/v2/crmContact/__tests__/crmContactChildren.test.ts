import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("crmContactEmail", () => {
  it("returns an email", async () => {
    const crmContactEmailLoader = jest.fn().mockResolvedValue({
      id: "email-1",
      crm_contact_id: "contact-1",
      partner_id: "partner-1",
      address: "ada@example.com",
      is_primary: true,
      bounced_at: null,
    })

    const result = await runAuthenticatedQuery(
      `{ crmContactEmail(id: "email-1") { internalID crmContactID address isPrimary bouncedAt } }`,
      { crmContactEmailLoader }
    )

    expect(crmContactEmailLoader).toHaveBeenCalledWith("email-1")
    expect(result).toEqual({
      crmContactEmail: {
        internalID: "email-1",
        crmContactID: "contact-1",
        address: "ada@example.com",
        isPrimary: true,
        bouncedAt: null,
      },
    })
  })
})

describe("crmContactEmailsConnection", () => {
  it("passes params to the loader and returns the connection", async () => {
    const crmContactEmailsLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "email-1",
          crm_contact_id: "contact-1",
          partner_id: "partner-1",
          address: "ada@example.com",
          is_primary: true,
        },
      ],
      headers: { "x-total-count": "1" },
    })

    const result = await runAuthenticatedQuery(
      `{
        crmContactEmailsConnection(crmContactID: "contact-1", sort: CREATED_AT_DESC, first: 5) {
          totalCount
          edges { node { address } }
        }
      }`,
      { crmContactEmailsLoader }
    )

    expect(crmContactEmailsLoader).toHaveBeenCalledWith({
      crm_contact_id: "contact-1",
      sort: "-created_at",
      total_count: true,
      size: 5,
      offset: 0,
    })
    expect(result).toEqual({
      crmContactEmailsConnection: {
        totalCount: 1,
        edges: [{ node: { address: "ada@example.com" } }],
      },
    })
  })
})

describe("crmContactLocation", () => {
  it("returns a location", async () => {
    const crmContactLocationLoader = jest.fn().mockResolvedValue({
      id: "location-1",
      crm_contact_id: "contact-1",
      partner_id: "partner-1",
      country_code: "GB",
      city_name: null,
      is_primary: true,
    })

    const result = await runAuthenticatedQuery(
      `{ crmContactLocation(id: "location-1") { internalID countryCode cityName isPrimary } }`,
      { crmContactLocationLoader }
    )

    expect(crmContactLocationLoader).toHaveBeenCalledWith("location-1")
    expect(result).toEqual({
      crmContactLocation: {
        internalID: "location-1",
        countryCode: "GB",
        cityName: null,
        isPrimary: true,
      },
    })
  })
})

describe("crmContactLocationsConnection", () => {
  it("passes params to the loader and returns the connection", async () => {
    const crmContactLocationsLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "location-1",
          crm_contact_id: "contact-1",
          partner_id: "partner-1",
          country_code: "GB",
          city_name: "London",
          is_primary: true,
        },
      ],
      headers: { "x-total-count": "1" },
    })

    const result = await runAuthenticatedQuery(
      `{
        crmContactLocationsConnection(crmContactID: "contact-1", first: 5) {
          totalCount
          edges { node { cityName } }
        }
      }`,
      { crmContactLocationsLoader }
    )

    expect(crmContactLocationsLoader).toHaveBeenCalledWith({
      crm_contact_id: "contact-1",
      sort: undefined,
      total_count: true,
      size: 5,
      offset: 0,
    })
    expect(result).toEqual({
      crmContactLocationsConnection: {
        totalCount: 1,
        edges: [{ node: { cityName: "London" } }],
      },
    })
  })
})
