import { getFieldsForTypeFromSchema } from "lib/stitching/lib/getTypesFromSchema"
import { getExchangeMergedSchema } from "../../__tests__/testingUtils"

describe("CommerceOrderResult type", () => {
  it("adds commerceOrderResult field to Query", async () => {
    const mergedSchema = await getExchangeMergedSchema()
    const queryFields = await getFieldsForTypeFromSchema("Query", mergedSchema)

    expect(queryFields).toContain("commerceOrderResult")
  })

  it("defines CommerceOrderError type with requestError field", async () => {
    const mergedSchema = await getExchangeMergedSchema()
    const errorFields = await getFieldsForTypeFromSchema(
      "CommerceOrderError",
      mergedSchema
    )

    expect(errorFields).toContain("requestError")
  })

  it("defines RequestError type with statusCode field", async () => {
    const mergedSchema = await getExchangeMergedSchema()
    const requestErrorFields = await getFieldsForTypeFromSchema(
      "RequestError",
      mergedSchema
    )

    expect(requestErrorFields).toContain("statusCode")
  })

  it("union includes CommerceBuyOrder, CommerceOfferOrder, and CommerceOrderError", async () => {
    const mergedSchema = await getExchangeMergedSchema()
    const commerceOrderResultType = mergedSchema.getType("CommerceOrderResult")

    expect(commerceOrderResultType).toBeDefined()

    const types = ((commerceOrderResultType as unknown) as {
      getTypes: () => Array<{ name: string }>
    })
      .getTypes()
      .map((t) => t.name)
      .sort()

    expect(types).toEqual([
      "CommerceBuyOrder",
      "CommerceOfferOrder",
      "CommerceOrderError",
    ])
  })
})
