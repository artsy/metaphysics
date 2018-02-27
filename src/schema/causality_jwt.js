import jwt from "jwt-simple"
import { GraphQLString, GraphQLNonNull, GraphQLEnumType } from "graphql"

const { HMAC_SECRET } = process.env

export default {
  type: GraphQLString,
  description: "Creates, and authorizes, a JWT custom for Causality",
  args: {
    role: {
      type: new GraphQLEnumType({
        name: "Role",
        values: {
          PARTICIPANT: { value: "PARTICIPANT" },
          OPERATOR: { value: "OPERATOR" },
        },
      }),
      description: "",
    },
    sale_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the auction to participate in",
    },
  },
  resolve: (
    root,
    options,
    request,
    { rootValue: { accessToken, meLoader, meBiddersLoader, saleLoader } }
  ) => {
    // Observer role for logged out users
    if (!accessToken) {
      return saleLoader(options.sale_id).then(sale =>
        jwt.encode(
          {
            aud: "auctions",
            role: "observer",
            userId: null,
            saleId: sale._id,
            bidderId: null,
            iat: new Date().getTime(),
          },
          HMAC_SECRET
        )
      )

      // For logged in and...
    } else if (options.role === "PARTICIPANT") {
      return Promise.all([
        saleLoader(options.sale_id),
        meLoader(),
        meBiddersLoader({ sale_id: options.sale_id }),
      ]).then(([sale, me, bidders]) => {
        if (bidders.length && bidders[0].qualified_for_bidding) {
          return jwt.encode(
            {
              aud: "auctions",
              role: "bidder",
              userId: me._id,
              saleId: sale._id,
              bidderId: bidders[0].id,
              iat: new Date().getTime(),
            },
            HMAC_SECRET
          )
        }
        return jwt.encode(
          {
            aud: "auctions",
            role: "observer",
            userId: me._id,
            saleId: sale._id,
            bidderId: null,
            iat: new Date().getTime(),
          },
          HMAC_SECRET
        )
      })

      // Operator role if logged in as an admin
    } else if (options.role === "OPERATOR") {
      return Promise.all([saleLoader(options.sale_id), meLoader()]).then(
        ([sale, me]) => {
          if (me.type !== "Admin") {
            throw new Error("Unauthorized to be operator")
          }
          return jwt.encode(
            {
              aud: "auctions",
              role: "operator",
              userId: me._id,
              saleId: sale._id,
              bidderId: me.paddle_number,
              iat: new Date().getTime(),
            },
            HMAC_SECRET
          )
        }
      )
    }
  },
}
