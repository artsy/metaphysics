import { identity, pickBy } from "lodash"

export const convertToGravityArgs = (args: any) => {
  const gravityArgs = pickBy(
    {
      artist_id: args.artistID,
      artsy_commission: args.artsyCommission,
      artwork_id: args.artworkID,
      discover_admin_id: args.discoverAdminID,
      email: args.email,
      fair_id: args.fairID,
      note: args.note,
      owner_id: args.ownerID,
      owner_type: args.ownerType,
      partner_id: args.partnerID,
      sale_date: convertStringDateToInteger(args.saleDate),
      sale_admin_id: args.saleAdminID,
      sale_id: args.saleID,
      sale_price: args.salePrice,
      source: args.source,
      user_id: args.userID,
    },
    identity
  )

  return gravityArgs
}

// Gravity expects sale_date to be an integer, but the input is a string
// so we need to convert the string to an integer first.
const convertStringDateToInteger = (date: string | null) => {
  if (!date) {
    return null
  }

  const dateObj = new Date(date)
  // getTime() returns the number of milliseconds, but ruby's Time.at()
  // expects the number of seconds since the epoch. That's why we divide by 1000.
  return Math.floor(dateObj.getTime() / 1000)
}
