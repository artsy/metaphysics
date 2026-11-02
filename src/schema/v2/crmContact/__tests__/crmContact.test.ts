import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const gravityContact = {
  id: "contact-1",
  partner_id: "partner-1",
  assigned_to_user_id: null,
  contact_type: "person",
  first_name: "Ada",
  last_name: "Lovelace",
  company: null,
  display_name: "Ada Lovelace",
  phone: "+44 20 7946 0958",
  normalized_phone: "+442079460958",
  status: "active",
  archived_at: null,
  categories: ["collector", "buyer"],
  notes: null,
  emails: [
    {
      id: "email-1",
      crm_contact_id: "contact-1",
      partner_id: "partner-1",
      address: "ada@example.com",
      is_primary: true,
      bounced_at: null,
    },
  ],
  locations: [
    {
      id: "location-1",
      crm_contact_id: "contact-1",
      partner_id: "partner-1",
      country_code: "GB",
      city_name: "London",
      is_primary: true,
    },
  ],
}

describe("crmContact", () => {
  const query = `
    {
      crmContact(id: "contact-1") {
        internalID
        partnerID
        contactType
        displayName
        normalizedPhone
        status
        categories
        emails {
          address
          isPrimary
        }
        locations {
          countryCode
          cityName
          isPrimary
        }
      }
    }
  `

  it("passes the id to the loader", async () => {
    const crmContactLoader = jest.fn().mockResolvedValue(gravityContact)

    await runAuthenticatedQuery(query, { crmContactLoader })

    expect(crmContactLoader).toHaveBeenCalledWith("contact-1")
  })

  it("returns the contact with its emails and locations", async () => {
    const crmContactLoader = jest.fn().mockResolvedValue(gravityContact)

    const result = await runAuthenticatedQuery(query, { crmContactLoader })

    expect(result).toEqual({
      crmContact: {
        internalID: "contact-1",
        partnerID: "partner-1",
        contactType: "PERSON",
        displayName: "Ada Lovelace",
        normalizedPhone: "+442079460958",
        status: "ACTIVE",
        categories: ["collector", "buyer"],
        emails: [{ address: "ada@example.com", isPrimary: true }],
        locations: [{ countryCode: "GB", cityName: "London", isPrimary: true }],
      },
    })
  })
})

describe("crmContactsConnection", () => {
  const query = `
    {
      crmContactsConnection(
        partnerID: "partner-1"
        status: ARCHIVED
        category: "collector"
        query: "ada"
        sort: DISPLAY_NAME_DESC
        first: 1
      ) {
        totalCount
        edges {
          node {
            internalID
            emails {
              address
            }
          }
        }
      }
    }
  `

  let context: Partial<ResolverContext>

  beforeEach(() => {
    context = {
      crmContactsLoader: jest.fn().mockResolvedValue({
        body: [gravityContact],
        headers: { "x-total-count": "1" },
      }),
    }
  })

  it("passes correct params to the loader", async () => {
    await runAuthenticatedQuery(query, context)

    expect(context.crmContactsLoader as jest.Mock).toHaveBeenCalledWith({
      partner_id: "partner-1",
      status: "archived",
      category: "collector",
      q: "ada",
      sort: "-display_name",
      total_count: true,
      size: 1,
      offset: 0,
    })
  })

  it("returns a connection of contacts", async () => {
    const result = await runAuthenticatedQuery(query, context)

    expect(result).toEqual({
      crmContactsConnection: {
        totalCount: 1,
        edges: [
          {
            node: {
              internalID: "contact-1",
              emails: [{ address: "ada@example.com" }],
            },
          },
        ],
      },
    })
  })

  it("does not call any other loader for emails and locations", async () => {
    const crmContactEmailsLoader = jest.fn()
    const crmContactLocationsLoader = jest.fn()

    await runAuthenticatedQuery(query, {
      ...context,
      crmContactEmailsLoader,
      crmContactLocationsLoader,
    })

    expect(crmContactEmailsLoader).not.toHaveBeenCalled()
    expect(crmContactLocationsLoader).not.toHaveBeenCalled()
  })
})
