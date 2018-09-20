// @ts-check

import { CreditCard } from "schema/credit_card"
import { pageable } from "relay-cursor-paging"
import { connectionWithCursorInfo } from "schema/fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"

export const CreditCards = {
  type: connectionWithCursorInfo(CreditCard.type),
  args: pageable(),
  description: "A list of the current user’s credit cards",
  resolve: (
    _root,
    options,
    _request,
    { rootValue: { accessToken, meCreditCardsLoader } }
  ) => {
    if (!accessToken) return null
    return meCreditCardsLoader().then(({ body }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: body && body.length,
        sliceStart: 0,
      })
    })
  },
}
