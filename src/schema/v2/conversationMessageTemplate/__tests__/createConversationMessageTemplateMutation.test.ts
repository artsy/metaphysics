import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createConversationMessageTemplateMutation", () => {
  const mutation = gql`
    mutation {
      createConversationMessageTemplate(
        input: {
          partnerId: "partner-123"
          title: "New Template"
          body: "Template body text"
          description: "Template description"
        }
      ) {
        responseOrError {
          __typename
          ... on CreateConversationMessageTemplateSuccess {
            conversationMessageTemplate {
              internalID
              title
              body
              description
              currentVersionId
            }
            partner {
              internalID
            }
          }
          ... on CreateConversationMessageTemplateFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const createdTemplate = {
    id: "template-new",
    partner_id: "partner-123",
    title: "New Template",
    body: "Template body text",
    description: "Template description",
    current_version_id: "version-new",
  }

  const mockCreateLoader = jest.fn()

  const context = {
    createConversationMessageTemplateLoader: mockCreateLoader,
    partnerLoader: jest.fn().mockResolvedValue({
      id: "partner-123",
      _id: "partner-123",
    }),
  }

  beforeEach(() => {
    mockCreateLoader.mockResolvedValue(createdTemplate)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("creates a conversation message template", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(res).toMatchInlineSnapshot(`
      {
        "createConversationMessageTemplate": {
          "responseOrError": {
            "__typename": "CreateConversationMessageTemplateSuccess",
            "conversationMessageTemplate": {
              "body": "Template body text",
              "currentVersionId": "version-new",
              "description": "Template description",
              "internalID": "template-new",
              "title": "New Template",
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

    expect(mockCreateLoader).toHaveBeenCalledWith({
      partner_id: "partner-123",
      title: "New Template",
      body: "Template body text",
      description: "Template description",
    })
  })
})
