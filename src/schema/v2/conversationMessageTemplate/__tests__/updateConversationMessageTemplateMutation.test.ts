import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateConversationMessageTemplateMutation", () => {
  const mutation = gql`
    mutation {
      updateConversationMessageTemplate(
        input: {
          id: "template-123"
          title: "Updated Title"
          body: "Updated body text"
        }
      ) {
        responseOrError {
          __typename
          ... on UpdateConversationMessageTemplateSuccess {
            conversationMessageTemplate {
              internalID
              title
              body
              currentVersionId
            }
            partner {
              internalID
            }
          }
          ... on UpdateConversationMessageTemplateFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const updatedTemplate = {
    id: "template-123",
    partner_id: "partner-123",
    title: "Updated Title",
    body: "Updated body text",
    description: "Original description",
    current_version_id: "version-new",
  }

  const mockUpdateLoader = jest.fn()

  const context = {
    updateConversationMessageTemplateLoader: mockUpdateLoader,
    partnerLoader: jest.fn().mockResolvedValue({
      id: "partner-123",
      _id: "partner-123",
    }),
  }

  beforeEach(() => {
    mockUpdateLoader.mockResolvedValue(updatedTemplate)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("updates a conversation message template", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(res).toMatchInlineSnapshot(`
      {
        "updateConversationMessageTemplate": {
          "responseOrError": {
            "__typename": "UpdateConversationMessageTemplateSuccess",
            "conversationMessageTemplate": {
              "body": "Updated body text",
              "currentVersionId": "version-new",
              "internalID": "template-123",
              "title": "Updated Title",
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

    expect(mockUpdateLoader).toHaveBeenCalledWith("template-123", {
      title: "Updated Title",
      body: "Updated body text",
    })
  })
})
