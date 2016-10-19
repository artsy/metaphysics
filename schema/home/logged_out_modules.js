export default(auction, fair) => {
  const modules = [
    {
      key: 'popular_artists',
      display: true,
    },
    {
      key: 'live_auctions',
      display: auction ? true : false,
    },
    {
      key: 'current_fairs',
      display: fair ? true : false,
    },
  ];
  return modules;
};
