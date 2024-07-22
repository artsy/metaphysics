import { isFieldRequested } from "lib/isFieldRequested"
import {
  parseResolveInfo,
  simplifyParsedResolveInfoFragmentWithType,
} from "graphql-parse-resolve-info"
import { GraphQLResolveInfo } from "graphql"

jest.mock("graphql-parse-resolve-info", () => ({
  parseResolveInfo: jest.fn(),
  simplifyParsedResolveInfoFragmentWithType: jest.fn(),
}))

describe("isFieldRequested", () => {
  const mockResolveInfo: GraphQLResolveInfo = {} as any // Mocked, as the actual value is not used due to mocking of dependencies

  beforeEach(() => {
    ;(parseResolveInfo as jest.Mock).mockReturnValue({})
    ;(simplifyParsedResolveInfoFragmentWithType as jest.Mock).mockReturnValue(
      {}
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return true for a root level field", () => {
    ;(simplifyParsedResolveInfoFragmentWithType as jest.Mock).mockReturnValue({
      fields: {
        TopField: {
          name: "topField",
        },
      },
    })

    expect(isFieldRequested("topField", mockResolveInfo)).toBe(true)
  })

  it("should return true for a nested field", () => {
    ;(simplifyParsedResolveInfoFragmentWithType as jest.Mock).mockReturnValue({
      fields: {
        ParentType: {
          name: "parentField",
          fieldsByTypeName: {
            SomethingElseType: {
              nestedField: {
                name: "somethingElseField",
                fieldsByTypeName: {},
              },
            },
            NestedType: {
              nestedField: {
                name: "nestedField",
                fieldsByTypeName: {},
              },
            },
          },
        },
      },
    })

    expect(isFieldRequested("parentField.nestedField", mockResolveInfo)).toBe(
      true
    )
  })

  it("should return true for a requested field with sub-field selections", () => {
    ;(simplifyParsedResolveInfoFragmentWithType as jest.Mock).mockReturnValue({
      fields: {
        ParentType: {
          name: "parentField",
          fieldsByTypeName: {
            SomethingElseType: {
              nestedField: {
                name: "somethingElseField",
                fieldsByTypeName: {},
              },
            },
            NestedType: {
              nestedField: {
                name: "nestedField",
                fieldsByTypeName: {},
              },
            },
          },
        },
      },
    })

    expect(isFieldRequested("parentField", mockResolveInfo)).toBe(true)
  })

  it("should return false for a non-existent nested field", () => {
    ;(simplifyParsedResolveInfoFragmentWithType as jest.Mock).mockReturnValue({
      fields: {
        ParentField: {
          name: "parentField",
          fieldsByTypeName: {
            TypeName: { name: "somethingElse" },
          },
        },
      },
    })

    expect(isFieldRequested("parentField.missingField", mockResolveInfo)).toBe(
      false
    )
  })
})
