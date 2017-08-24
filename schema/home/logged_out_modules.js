export default (auction, fair) => {
  const modules = [
    {
      key: "popular_artists",
      display: true,
    },
    {
      key: "current_fairs",
      display: fair ? true : false,
    },
    {
      key: "live_auctions",
      display: auction ? true : false,
    },
  ]
  return modules
}
