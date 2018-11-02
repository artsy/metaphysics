// @ts-check

import { CreditCardConnection } from "schema/credit_card"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import { parseRelayOptions } from "lib/helpers"
import { GraphQLInt } from "graphql"

export const CreditCards = {
  type: CreditCardConnection,
  args: pageable({
    limit: {
      type: GraphQLInt,
    },
  }),
  description: "A list of the current user’s credit cards",
  resolve: (
    _root,
    options,
    _request,
    { rootValue: { accessToken, meCreditCardsLoader } }
  ) => {
    if (!accessToken) return null
    const { page, size } = parseRelayOptions(options)
    return meCreditCardsLoader({ page, size }).then(({ body }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: body && body.length,
        sliceStart: 0,
      })
    })
  },
}
