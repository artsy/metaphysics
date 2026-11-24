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
  const mockParseResolveInfo = parseResolveInfo as jest.Mock
  const mockSimplifyParsedResolveInfoFragmentWithType = simplifyParsedResolveInfoFragmentWithType as jest.Mock
  const mockResolveInfo: GraphQLResolveInfo = {} as any // Mocked, as the actual value is not used due to mocking of dependencies

  beforeEach(() => {
    mockParseResolveInfo.mockReturnValue({})
    mockSimplifyParsedResolveInfoFragmentWithType.mockReturnValue({})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return true for a root level field", () => {
    mockSimplifyParsedResolveInfoFragmentWithType.mockReturnValue({
      fields: {
        TopField: {
          name: "topField",
        },
      },
    })

    expect(isFieldRequested("topField", mockResolveInfo)).toBe(true)
  })

  it("should return true for a nested field", () => {
    mockSimplifyParsedResolveInfoFragmentWithType.mockReturnValue({
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
    mockSimplifyParsedResolveInfoFragmentWithType.mockReturnValue({
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
    mockSimplifyParsedResolveInfoFragmentWithType.mockReturnValue({
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
