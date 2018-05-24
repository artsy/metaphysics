export default (auction, fair) => {
  const modules = [
    {
      key: "popular_artists",
      display: true,
    },
    {
      key: "current_fairs",
      display: !!fair,
    },
    {
      key: "live_auctions",
      display: !!auction,
    },
  ]
  return modules
}
