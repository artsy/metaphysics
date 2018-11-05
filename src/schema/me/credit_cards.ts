// @ts-check

import { CreditCardConnection } from "schema/credit_card"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import { parseRelayOptions } from "lib/helpers"

export const CreditCards = {
  type: CreditCardConnection,
  args: pageable({}),
  description: "A list of the current user’s credit cards",
  resolve: (
    _root,
    options,
    _request,
    { rootValue: { accessToken, meCreditCardsLoader } }
  ) => {
    if (!accessToken) return null
    const { page, size, offset } = parseRelayOptions(options)
    const gravityArgs = { page, size, total_count: true }

    return meCreditCardsLoader(gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: headers["x-total-count"],
        sliceStart: offset,
      })
    })
  },
}
