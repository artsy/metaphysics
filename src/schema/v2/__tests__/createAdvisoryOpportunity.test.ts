import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createAdvisoryOpportunity(
      input: {
        message: "im a cat"
        searchCriteriaID: "search-criteria-id"
        phoneCountryCode: "DE"
        phoneNumber: "123456789"
      }
    ) {
      advisoryOpportunityOrError {
        __typename
        ... on createAdvisoryOpportunitySuccess {
          advisoryOpportunity {
            message
          }
        }
      }
    }
  }
`

describe("createAdvisoryOpportunityMutation", () => {
  const advisoryOpportunity = {
    id: "advisory-opportunity-id",
    message: "im a cat",
  }

  const mockCreateAdvisoryOpportunityLoader = jest.fn()

  const context = {
    createAdvisoryOpportunityLoader: mockCreateAdvisoryOpportunityLoader,
  }

  beforeEach(() => {
    mockCreateAdvisoryOpportunityLoader.mockResolvedValue(
      Promise.resolve(advisoryOpportunity)
    )
  })

  afterEach(() => {
    mockCreateAdvisoryOpportunityLoader.mockReset()
  })

  it("returns an advisory opportunity", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(mockCreateAdvisoryOpportunityLoader).toBeCalledWith({
      message: "im a cat",
      search_criteria_id: "search-criteria-id",
      phone_country_code: "DE",
      phone_number: "123456789",
    })

    expect(res).toEqual({
      createAdvisoryOpportunity: {
        advisoryOpportunityOrError: {
          __typename: "createAdvisoryOpportunitySuccess",
          advisoryOpportunity: {
            message: "im a cat",
          },
        },
      },
    })
  })
})
