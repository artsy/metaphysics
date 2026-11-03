import { createAnthropic } from "@ai-sdk/anthropic"

describe("anthropic", () => {
  // The agent's last step relies on this (see prepareStep in runTurn): older
  // provider versions dropped the tools instead, which breaks the prompt cache.
  it("keeps the tools in the request when toolChoice is none", async () => {
    let body: any
    const provider = createAnthropic({
      apiKey: "sk-test",
      fetch: async (_url, init) => {
        body = JSON.parse(String(init?.body))
        throw new Error("stop before the network")
      },
    })

    await expect(
      provider("claude-sonnet-5").doGenerate({
        prompt: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
        tools: [
          {
            type: "function",
            name: "query_artsy",
            inputSchema: { type: "object", properties: {} },
          },
        ],
        toolChoice: { type: "none" },
      })
    ).rejects.toThrow()

    expect(body.tools.map((tool: any) => tool.name)).toEqual(["query_artsy"])
    expect(body.tool_choice).toEqual({ type: "none" })
  })
})
