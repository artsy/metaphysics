/* @flow */

export default(auction, fair) => {
  const modules = [
    {
      key: 'iconic_artists',
      display: true,
    },
    {
      key: 'live_auctions',
      display: Boolean(auction)
    },
    {
      key: 'current_fairs',
      display: Boolean(fair)
    },
  ];
  return modules;
};
