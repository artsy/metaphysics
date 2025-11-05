import { runQuery } from "schema/v2/test/utils"

describe("AI", () => {
  describe("prompt field", () => {
    it("returns null when no id is provided", async () => {
      const context = {
        aiPromptTemplateLoader: jest.fn(),
        aiPromptTemplatesLoader: jest.fn(),
      }

      const query = `
        {
          ai {
            prompt {
              internalID
            }
          }
        }
      `
      const result = await runQuery(query, context)
      expect(result.ai.prompt).toBeNull()
      expect(context.aiPromptTemplateLoader).not.toHaveBeenCalled()
    })

    it("returns a prompt template when id is provided", async () => {
      const mockPrompt = {
        id: "prompt-123",
        name: "Test Prompt",
        model: "claude",
        system_prompt: "You are a helpful assistant",
        user_prompt: "Help me with {task}",
      }

      const context = {
        aiPromptTemplateLoader: jest.fn().mockResolvedValue(mockPrompt),
        aiPromptTemplatesLoader: jest.fn(),
      }

      const query = `
        {
          ai {
            prompt(id: "prompt-123") {
              internalID
              name
              model
              systemPrompt
              userPrompt
            }
          }
        }
      `

      const result = await runQuery(query, context)

      expect(context.aiPromptTemplateLoader).toHaveBeenCalledWith("prompt-123")
      expect(result.ai.prompt).toEqual({
        internalID: "prompt-123",
        name: "Test Prompt",
        model: "claude",
        systemPrompt: "You are a helpful assistant",
        userPrompt: "Help me with {task}",
      })
    })
  })

  describe("promptConnection field", () => {
    it("returns paginated prompt templates", async () => {
      const mockPrompts = [
        {
          id: "prompt-1",
          name: "Prompt 1",
          model: "claude",
          system_prompt: "System prompt 1",
          user_prompt: "User prompt 1",
        },
        {
          id: "prompt-2",
          name: "Prompt 2",
          model: "gpt",
          system_prompt: "System prompt 2",
          user_prompt: "User prompt 2",
        },
      ]

      const context = {
        aiPromptTemplateLoader: jest.fn(),
        aiPromptTemplatesLoader: jest.fn().mockResolvedValue({
          body: mockPrompts,
          headers: { "x-total-count": "2" },
        }),
      }

      const query = `
        {
          ai {
            promptConnection(first: 10) {
              edges {
                node {
                  internalID
                  name
                  model
                  systemPrompt
                  userPrompt
                }
              }
              totalCount
            }
          }
        }
      `

      const result = await runQuery(query, context)

      expect(context.aiPromptTemplatesLoader).toHaveBeenCalledWith({
        size: 10,
        offset: 0,
        total_count: true,
      })

      expect(result.ai.promptConnection.totalCount).toBe(2)
      expect(result.ai.promptConnection.edges).toHaveLength(2)
      expect(result.ai.promptConnection.edges[0].node).toEqual({
        internalID: "prompt-1",
        name: "Prompt 1",
        model: "claude",
        systemPrompt: "System prompt 1",
        userPrompt: "User prompt 1",
      })
    })

    it("supports filtering by name", async () => {
      const context = {
        aiPromptTemplateLoader: jest.fn(),
        aiPromptTemplatesLoader: jest.fn().mockResolvedValue({
          body: [],
          headers: { "x-total-count": "0" },
        }),
      }

      const query = `
        {
          ai {
            promptConnection(first: 10, name: "test") {
              totalCount
            }
          }
        }
      `

      await runQuery(query, context)

      expect(context.aiPromptTemplatesLoader).toHaveBeenCalledWith({
        size: 10,
        offset: 0,
        total_count: true,
        name: "test",
      })
    })

    it("supports filtering by model", async () => {
      const context = {
        aiPromptTemplateLoader: jest.fn(),
        aiPromptTemplatesLoader: jest.fn().mockResolvedValue({
          body: [],
          headers: { "x-total-count": "0" },
        }),
      }

      const query = `
        {
          ai {
            promptConnection(first: 10, model: "claude") {
              totalCount
            }
          }
        }
      `

      await runQuery(query, context)

      expect(context.aiPromptTemplatesLoader).toHaveBeenCalledWith({
        size: 10,
        offset: 0,
        total_count: true,
        model: "claude",
      })
    })

    it("supports both name and model filters", async () => {
      const context = {
        aiPromptTemplateLoader: jest.fn(),
        aiPromptTemplatesLoader: jest.fn().mockResolvedValue({
          body: [],
          headers: { "x-total-count": "0" },
        }),
      }

      const query = `
        {
          ai {
            promptConnection(first: 10, name: "test", model: "claude") {
              totalCount
            }
          }
        }
      `

      await runQuery(query, context)

      expect(context.aiPromptTemplatesLoader).toHaveBeenCalledWith({
        size: 10,
        offset: 0,
        total_count: true,
        name: "test",
        model: "claude",
      })
    })
  })
})
