import { parse, OperationTypeNode } from "graphql"

const mockDelegate = jest.fn().mockResolvedValue(null)
jest.mock("@graphql-tools/delegate", () => ({
  delegateToSchema: mockDelegate,
}))

// Imported after the mock is in place.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { delegateToSchema } = require("../delegateToSchema")

const buildInfoForFieldCall = (fieldSource: string) => {
  // Pull just the first field's AST out of a small query so we get realistic
  // FieldNode + variable definitions for `info`.
  const document = parse(`query Q($partnerId: ID!) { ${fieldSource} }`)
  const operation = document.definitions[0]
  if (operation.kind !== "OperationDefinition") {
    throw new Error("expected operation definition")
  }
  const fieldNode = operation.selectionSet.selections[0]
  if (fieldNode.kind !== "Field") {
    throw new Error("expected a Field selection")
  }
  return {
    fieldNodes: [fieldNode],
    operation,
    variableValues: { partnerId: "partner-1" },
  }
}

describe("delegateToSchema wrapper", () => {
  beforeEach(() => {
    mockDelegate.mockClear()
  })

  it("strips forwarded args from info.fieldNodes so delegate mints fresh variables", () => {
    const info = buildInfoForFieldCall(
      "orderConnection(sellerId: $partnerId, first: 5)"
    )

    delegateToSchema({
      schema: {} as any,
      operation: OperationTypeNode.QUERY,
      fieldName: "commerceOrders",
      args: { sellerId: "partner-1" },
      context: {},
      info: info as any,
    })

    const passedInfo = mockDelegate.mock.calls[0][0].info
    const passedArgs = passedInfo.fieldNodes[0].arguments.map(
      (a: any) => a.name.value
    )
    // `sellerId` was forwarded via `args`, so it must be stripped from the
    // original field node to prevent delegate v10+ from reusing the outer
    // `$partnerId: ID!` definition against a `String` target argument.
    expect(passedArgs).not.toContain("sellerId")
    // Untouched arguments are preserved.
    expect(passedArgs).toContain("first")
  })

  it("does not mutate the caller's info object", () => {
    const info = buildInfoForFieldCall("orderConnection(sellerId: $partnerId)")
    const originalArgNames = info.fieldNodes[0].arguments!.map(
      (a) => a.name.value
    )

    delegateToSchema({
      schema: {} as any,
      operation: OperationTypeNode.QUERY,
      fieldName: "commerceOrders",
      args: { sellerId: "partner-1" },
      context: {},
      info: info as any,
    })

    expect(info.fieldNodes[0].arguments!.map((a) => a.name.value)).toEqual(
      originalArgNames
    )
  })

  it("leaves info untouched when no args are explicitly forwarded", () => {
    const info = buildInfoForFieldCall("orderConnection(sellerId: $partnerId)")

    delegateToSchema({
      schema: {} as any,
      operation: OperationTypeNode.QUERY,
      fieldName: "commerceOrders",
      context: {},
      info: info as any,
    })

    const passedInfo = mockDelegate.mock.calls[0][0].info
    expect(passedInfo).toBe(info)
  })

  it("prefers info.mergeInfo.delegateToSchema when present (legacy mock path)", () => {
    const legacy = jest.fn().mockReturnValue("legacy-result")
    const info = {
      ...buildInfoForFieldCall("orderConnection(sellerId: $partnerId)"),
      mergeInfo: { delegateToSchema: legacy },
    }

    const result = delegateToSchema({
      schema: {} as any,
      operation: OperationTypeNode.QUERY,
      fieldName: "commerceOrders",
      args: { sellerId: "partner-1" },
      context: {},
      info: info as any,
    })

    expect(legacy).toHaveBeenCalledTimes(1)
    expect(mockDelegate).not.toHaveBeenCalled()
    expect(result).toBe("legacy-result")
  })
})
