import { date } from "./fields/date"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields, NodeInterface } from "./object_identification"
import { connectionWithCursorInfo } from "./fields/pagination"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "./fields/money"
import { PartnerOfferSourceEnumType } from "./partnerOffer"

// Buyer states that indicate the collector has committed to a purchase created
// from a partner offer. Kept in sync with the clients' previous logic.
const PURCHASED_BUYER_STATES = ["SUBMITTED", "APPROVED", "COMPLETED"]

/**
 * Fetches, in a single Exchange request, which of the given partner offers the
 * current user has a purchased-state order for, and stamps `_isPurchased` on
 * each offer.
 *
 * Call this from connection resolvers that return `PartnerOfferToCollector` so
 * the `isPurchased` field reads a precomputed value instead of firing one
 * Exchange `me/orders` request per node (an N+1 that scales with page size).
 */
export const stampPartnerOfferPurchases = async (
  offers: Array<{ id?: string; _isPurchased?: boolean }>,
  meOrdersLoader?: ResolverContext["meOrdersLoader"]
) => {
  if (!meOrdersLoader) return offers

  const ids = offers.map((offer) => offer.id).filter(Boolean)
  if (ids.length === 0) return offers

  try {
    const { body: orders } = await meOrdersLoader({
      partner_offer_ids: ids.join(","),
      buyer_state: PURCHASED_BUYER_STATES.join(","),
      size: ids.length,
    })

    const purchasedIds = new Set(
      (orders ?? []).flatMap((order) =>
        (order.line_items ?? [])
          .map((lineItem) => lineItem?.partner_offer_id)
          .filter(Boolean)
      )
    )

    offers.forEach((offer) => {
      offer._isPurchased = offer.id ? purchasedIds.has(offer.id) : false
    })
  } catch (error) {
    offers.forEach((offer) => {
      offer._isPurchased = false
    })
  }

  return offers
}

export const PartnerOfferToCollectorType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerOfferToCollector",
  interfaces: [NodeInterface],
  fields: () => ({
    ...IDFields,
    artworkId: {
      type: GraphQLString,
      resolve: ({ artwork_id }) => artwork_id,
    },
    createdAt: date(),
    endAt: date(),
    isActive: {
      type: GraphQLBoolean,
      resolve: ({ active }) => active,
    },
    isAvailable: {
      type: GraphQLBoolean,
      resolve: ({ available }) => available,
    },
    isPurchased: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description:
        "Whether the collector already has an order created from this partner offer in a purchased buyer state (submitted, approved, or completed).",
      resolve: async ({ id, _isPurchased }, _args, { meOrdersLoader }) => {
        // Precomputed in one batched Exchange request by connection resolvers
        // (see `stampPartnerOfferPurchases`). Fall back to a single lookup only
        // when the offer is reached outside such a connection.
        if (_isPurchased !== undefined) {
          return _isPurchased
        }

        if (!meOrdersLoader || !id) {
          return false
        }

        try {
          const { body: orders } = await meOrdersLoader({
            partner_offer_ids: id,
            buyer_state: PURCHASED_BUYER_STATES.join(","),
          })

          return (orders ?? []).length > 0
        } catch (error) {
          // A transient Exchange failure shouldn't null out this non-null field
          // and drop the whole offer from the list; treat it as "not purchased".
          return false
        }
      },
    },
    note: {
      type: GraphQLString,
    },
    partnerId: {
      type: GraphQLString,
      resolve: ({ partner_id }) => partner_id,
    },
    priceWithDiscount: {
      type: Money,
      resolve: (
        { price_with_discount_minor: minor, price_currency: currencyCode },
        args,
        context,
        info
      ) => {
        return resolveMinorAndCurrencyFieldsToMoney(
          {
            minor,
            currencyCode,
          },
          args,
          context,
          info
        )
      },
    },
    source: {
      type: PartnerOfferSourceEnumType,
    },
  }),
})

export const PartnerOfferToCollectorConnectionType = connectionWithCursorInfo({
  nodeType: PartnerOfferToCollectorType,
}).connectionType

export const PartnerOfferToCollectorSortsType = new GraphQLEnumType({
  name: "PartnerOfferToCollectorSorts",
  values: {
    CREATED_AT_ASC: {
      value: "created_at",
    },
    CREATED_AT_DESC: {
      value: "-created_at",
    },
    END_AT_ASC: {
      value: "end_at",
    },
    END_AT_DESC: {
      value: "-end_at",
    },
  },
})
