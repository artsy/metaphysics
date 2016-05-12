export default(auction, fair) => {
  const modules = [
    {
      key: 'iconic_artists',
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
