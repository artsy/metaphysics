import jwt from "jwt-simple"
import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLFieldConfig,
} from "graphql"
import config from "config"
import { ResolverContext } from "types/graphql"

const { HMAC_SECRET } = config

export const causalityJwt = ({ role, userId, saleId, bidderId }) =>
  jwt.encode(
    {
      aud: "auctions",
      role,
      userId,
      saleId,
      bidderId,
      iat: new Date().getTime(),
    },
    HMAC_SECRET
  )

const CausalityJWT: GraphQLFieldConfig<void, ResolverContext> = {
  type: GraphQLString,
  description: "Creates, and authorizes, a JWT custom for Causality",
  args: {
    role: {
      type: new GraphQLEnumType({
        name: "LiveAuctionRole",
        values: {
          PARTICIPANT: { value: "PARTICIPANT" },
          OPERATOR: { value: "OPERATOR" },
        },
      }),
      description: "",
    },
    saleID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the auction to participate in",
    },
  },
  resolve: (
    _root,
    { saleID, ..._options },
    { meLoader, meBiddersLoader, mePartnersLoader, saleLoader }
  ) => {
    const options: any = {
      sale_id: saleID,
      ..._options,
    }
    // Observer role for logged out users
    if (!meLoader || !meBiddersLoader || !mePartnersLoader) {
      return saleLoader(options.sale_id).then((sale) =>
        causalityJwt({
          role: "observer",
          userId: null,
          saleId: sale._id,
          bidderId: null,
        })
      )

      // For logged in and...
    } else if (options.role === "PARTICIPANT") {
      return Promise.all([
        saleLoader(options.sale_id),
        meLoader(),
        meBiddersLoader({ sale_id: options.sale_id }),
      ]).then(([sale, me, bidders]) => {
        if (bidders.length && bidders[0].qualified_for_bidding) {
          return causalityJwt({
            role: "bidder",
            userId: me._id,
            saleId: sale._id,
            bidderId: bidders[0].id,
          })
        }
        return causalityJwt({
          role: "observer",
          userId: me._id,
          saleId: sale._id,
          bidderId: null,
        })
      })
      // Operator role if logged in as an admin or if user has access to partner
    } else if (options.role === "OPERATOR") {
      return Promise.all([saleLoader(options.sale_id), meLoader()]).then(
        ([sale, me]) => {
          if (me.type === "Admin") {
            return causalityJwt({
              role: "operator",
              userId: me._id,
              saleId: sale._id,
              bidderId: me.paddle_number,
            })
          }

          if (sale.partner) {
            return mePartnersLoader({ "partner_ids[]": sale.partner._id }).then(
              (mePartners) => {
                // Check if current user has access to partner running the sale
                if (mePartners.length === 0) {
                  throw new Error("Unauthorized to be operator")
                }

                return causalityJwt({
                  role: "externalOperator",
                  userId: me._id,
                  saleId: sale._id,
                  bidderId: me.paddle_number,
                })
              }
            )
          } else {
            throw new Error("Unauthorized to be operator")
          }
        }
      )
    }
  },
}

export default CausalityJWT
