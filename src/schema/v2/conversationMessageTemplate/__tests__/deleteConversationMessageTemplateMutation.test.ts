import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deleteConversationMessageTemplateMutation", () => {
  const mutation = gql`
    mutation {
      deleteConversationMessageTemplate(input: { id: "template-123" }) {
        responseOrError {
          __typename
          ... on DeleteConversationMessageTemplateSuccess {
            conversationMessageTemplate {
              internalID
              title
            }
            partner {
              internalID
            }
          }
          ... on DeleteConversationMessageTemplateFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const deletedTemplate = {
    id: "template-123",
    partner_id: "partner-123",
    title: "Deleted Template",
    body: "Template body",
    description: "Description",
    current_version_id: "version-123",
  }

  const mockDeleteLoader = jest.fn()

  const context = {
    deleteConversationMessageTemplateLoader: mockDeleteLoader,
    partnerLoader: jest.fn().mockResolvedValue({
      id: "partner-123",
      _id: "partner-123",
    }),
  }

  beforeEach(() => {
    mockDeleteLoader.mockResolvedValue(deletedTemplate)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("deletes a conversation message template", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(res).toMatchInlineSnapshot(`
      {
        "deleteConversationMessageTemplate": {
          "responseOrError": {
            "__typename": "DeleteConversationMessageTemplateSuccess",
            "conversationMessageTemplate": {
              "internalID": "template-123",
              "title": "Deleted Template",
            },
            "partner": {
              "internalID": "partner-123",
            },
          },
        },
      }
    `)
  })

  it("calls the loader with correct parameters", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockDeleteLoader).toHaveBeenCalledWith("template-123")
  })
})
