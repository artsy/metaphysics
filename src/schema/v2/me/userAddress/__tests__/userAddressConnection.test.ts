import { UserAddressesConnection } from "../userAddressesConnection"
import config from "config"

const shouldSkip = !config.USE_UNSTITCHED_USER_ADDRESS

;(shouldSkip ? describe.skip : describe)("addressConnection", () => {
  beforeAll(() => {
    if (!config.USE_UNSTITCHED_USER_ADDRESS) {
      console.log(
        "Skipping addressConnection tests - USE_UNSTITCHED_USER_ADDRESS is false"
      )
    }
  })
  const mockUserAddress = {
    id: 77379,
    name: "Address 1",
    address_line_1: "Street Address 1",
    address_line_2: "",
    address_line_3: null,
    city: "NY",
    region: "NY",
    postal_code: "11000",
    country: "US",
    phone_number: "(123) 123 123 13",
    phone_number_country_code: "AE",
    user_id: "percy-cat",
    is_default: true,
  }

  const mockContext = {
    meUserAddressesLoader: jest.fn(),
  } as any

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should throw error when meUserAddressesLoader is not available", async () => {
    const contextWithoutLoader = {} as any

    await expect(
      UserAddressesConnection.resolve!(
        undefined,
        {},
        contextWithoutLoader,
        {} as any
      )
    ).rejects.toThrow("You need to be signed in to perform this action")
  })

  it("should call meUserAddressesLoader with correct parameters", async () => {
    const mockResponse = {
      body: [mockUserAddress],
      headers: { "x-total-count": "1" },
    }
    mockContext.meUserAddressesLoader.mockResolvedValue(mockResponse)

    const args = { first: 10 }

    await UserAddressesConnection.resolve!(
      undefined,
      args,
      mockContext,
      {} as any
    )

    expect(mockContext.meUserAddressesLoader).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      total_count: true,
    })
  })

  it("should return paginated results with correct structure", async () => {
    const mockResponse = {
      body: [mockUserAddress],
      headers: { "x-total-count": "1" },
    }
    mockContext.meUserAddressesLoader.mockResolvedValue(mockResponse)

    const args = { first: 10 }

    const result = await UserAddressesConnection.resolve!(
      undefined,
      args,
      mockContext,
      {} as any
    )

    expect(result).toHaveProperty("totalCount", 1)
    expect(result).toHaveProperty("pageCursors")
    expect(result).toHaveProperty("edges")
    expect(result).toHaveProperty("pageInfo")
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0].node).toEqual(mockUserAddress)
  })

  it("should handle empty results", async () => {
    const mockResponse = {
      body: [],
      headers: { "x-total-count": "0" },
    }
    mockContext.meUserAddressesLoader.mockResolvedValue(mockResponse)

    const args = { first: 10 }

    const result = await UserAddressesConnection.resolve!(
      undefined,
      args,
      mockContext,
      {} as any
    )

    expect(result.totalCount).toBe(0)
    expect(result.edges).toHaveLength(0)
    expect(result.pageInfo.hasNextPage).toBe(false)
  })

  it("should handle pagination with cursor", async () => {
    const mockResponse = {
      body: [mockUserAddress],
      headers: { "x-total-count": "1" },
    }
    mockContext.meUserAddressesLoader.mockResolvedValue(mockResponse)

    const args = { first: 5 }

    await UserAddressesConnection.resolve!(
      undefined,
      args,
      mockContext,
      {} as any
    )

    expect(mockContext.meUserAddressesLoader).toHaveBeenCalledWith({
      page: 1,
      size: 5,
      total_count: true,
    })
  })

  it("should have pageable arguments", () => {
    const args = UserAddressesConnection.args!
    expect(args.first).toBeDefined()
    expect(args.after).toBeDefined()
    expect(args.last).toBeDefined()
    expect(args.before).toBeDefined()
  })
})
