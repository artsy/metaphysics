export default (auction, fair) => {
  const modules = [
    {
      key: "current_fairs",
      display: fair ? true : false,
    },
    {
      key: "live_auctions",
      display: auction ? true : false,
    },
    {
      key: "popular_artists",
      display: true,
    },
  ]
  return modules
}
