import { createAnthropic } from "@ai-sdk/anthropic"
import config from "config"
import { isLiteLLMConfigured, litellmURL } from "../anthropic"

describe("anthropic", () => {
  const original = {
    LITELLM_BASE_URL: config.LITELLM_BASE_URL,
    LITELLM_API_KEY: config.LITELLM_API_KEY,
  }

  afterEach(() => {
    Object.assign(config, original)
  })

  it("routes through LiteLLM only when both URL and key are set", () => {
    Object.assign(config, { LITELLM_BASE_URL: "https://litellm.invalid" })
    Object.assign(config, { LITELLM_API_KEY: undefined })
    expect(isLiteLLMConfigured()).toBe(false)

    Object.assign(config, { LITELLM_API_KEY: "sk-virtual-key" })
    expect(isLiteLLMConfigured()).toBe(true)
  })

  it.each(["https://litellm.invalid", "https://litellm.invalid/v1/"])(
    "litellmURL resolves from the gateway root for %s",
    (base) => {
      Object.assign(config, { LITELLM_BASE_URL: base })

      expect(litellmURL("/v1")).toEqual("https://litellm.invalid/v1")
    }
  )

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
