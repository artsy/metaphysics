export const isInAuctionResolver = async (
  { sale_ids },
  _options,
  { salesLoader }
) => {
  if (sale_ids && sale_ids.length > 0) {
    const sales = await salesLoader({
      id: sale_ids,
      is_auction: true,
    })

    return sales.length > 0
  }

  return false
}
