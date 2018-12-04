// @ts-check

import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { SaleType } from "schema/sale/index"

export const endSaleMutation = mutationWithClientMutationId({
  name: "EndSale",
  description: "Mark sale as ended.",
  inputFields: {
    sale_id: {
      type: GraphQLString,
    },
  },
  outputFields: {
    sale: {
      type: SaleType,
      resolve: sale => sale,
    },
  },
  mutateAndGetPayload: (
    { sale_id },
    _request,
    { rootValue: { accessToken, endSaleLoader } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    return endSaleLoader(sale_id)
  },
})
