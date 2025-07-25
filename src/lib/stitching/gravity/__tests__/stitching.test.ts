import { getFieldsForTypeFromSchema } from "lib/stitching/lib/getTypesFromSchema"
import {
  getGravityMergedSchema,
  getGravityStitchedSchema,
} from "./testingUtils"
import config from "config"

describe("gravity/stitching", () => {
  describe("#addressConnection", () => {
    it("extends the Me type with an addressConnection field", async () => {
      if (config.USE_UNSTITCHED_USER_ADDRESS) {
        return
      }

      const mergedSchema = await getGravityMergedSchema()
      const addressConnectionFields = await getFieldsForTypeFromSchema(
        "Me",
        mergedSchema
      )
      expect(addressConnectionFields).toContain("addressConnection")
    })

    it("resolves addressConnection on Me as a paginated list", async () => {
      const { resolvers } = await getGravityStitchedSchema()

      if (config.USE_UNSTITCHED_USER_ADDRESS) {
        return
      }

      expect(resolvers.Me).toBeDefined()
      const { addressConnection } = resolvers.Me!
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }

      addressConnection.resolve({}, { first: 2 }, { userID: 1 }, info)

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: { userId: 1, first: 2 },
        operation: "query",
        fieldName: "_unused_gravity_userAddressConnection",
        schema: expect.anything(),
        context: expect.anything(),
        info: expect.anything(),
      })
    })

    it("has empty resolvers when unstiching is enabled", async () => {
      const { resolvers } = await getGravityStitchedSchema()

      if (!config.USE_UNSTITCHED_USER_ADDRESS) {
        return
      }

      expect(resolvers).toEqual({})
    })
  })

  describe("#UserAddress", () => {
    it("extends the UserAddress type with an id field", async () => {
      if (config.USE_UNSTITCHED_USER_ADDRESS) {
        return
      }

      const mergedSchema = await getGravityMergedSchema()
      const userAddressField = await getFieldsForTypeFromSchema(
        "UserAddress",
        mergedSchema
      )

      expect(userAddressField).toContain("id")
    })

    it("includes stitched id resolver when stitching enabled", async () => {
      const { resolvers } = await getGravityStitchedSchema()

      if (config.USE_UNSTITCHED_USER_ADDRESS) {
        return
      }

      expect(resolvers.UserAddress).toBeDefined()
      expect(resolvers.UserAddress!.id).toBeDefined()
    })
  })
})
