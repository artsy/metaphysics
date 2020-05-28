import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { SaleType } from "schema/v1/sale/index"
import { ResolverContext } from "types/graphql"

export const endSaleMutation = mutationWithClientMutationId<
  { sale_id: string },
  { sale: any },
  ResolverContext
>({
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
      resolve: (sale) => sale,
    },
  },
  mutateAndGetPayload: ({ sale_id }, { endSaleLoader }) => {
    if (!endSaleLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    return endSaleLoader(sale_id)
  },
})
