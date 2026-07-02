import { parse, print } from "graphql"
import { withResponseLogging } from "../logLinkMiddleware"

describe("withResponseLogging", () => {
  it("strips metaphysics-only directives from the request document before forwarding", async () => {
    const executor = jest.fn().mockResolvedValue({ data: {} })
    const wrapped = withResponseLogging("TestService", executor)

    const document = parse(`
      query Test($id: ID!) {
        order(id: $id) @principalField {
          state @optionalField
          total @cacheable(ttlSeconds: 60)
        }
      }
    `)

    await wrapped({ document, variables: { id: "abc" }, context: {} } as any)

    expect(executor).toHaveBeenCalledTimes(1)
    const forwarded = executor.mock.calls[0][0].document
    const printed = print(forwarded)
    expect(printed).not.toMatch(/@principalField/)
    expect(printed).not.toMatch(/@optionalField/)
    expect(printed).not.toMatch(/@cacheable/)
    // Selections themselves are preserved.
    expect(printed).toMatch(/order\(id: \$id\)/)
    expect(printed).toMatch(/state/)
    expect(printed).toMatch(/total/)
  })

  it("leaves directives that are not metaphysics-only intact", async () => {
    const executor = jest.fn().mockResolvedValue({ data: {} })
    const wrapped = withResponseLogging("TestService", executor)

    const document = parse(`
      query Test($skipName: Boolean!) {
        order(id: "abc") {
          name @skip(if: $skipName)
        }
      }
    `)

    await wrapped({
      document,
      variables: { skipName: false },
      context: {},
    } as any)

    const forwarded = executor.mock.calls[0][0].document
    expect(print(forwarded)).toMatch(/@skip\(if: \$skipName\)/)
  })

  it("forwards the executor's result unchanged", async () => {
    const expected = { data: { order: { state: "PENDING" } } }
    const executor = jest.fn().mockResolvedValue(expected)
    const wrapped = withResponseLogging("TestService", executor)

    const result = await wrapped({
      document: parse(`{ order { state } }`),
      variables: {},
      context: {},
    } as any)

    expect(result).toBe(expected)
  })
})
