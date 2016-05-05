import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../../schema';

describe('BidderStatus type', () => {
  const Me = schema.__get__('Me');
  const BidderStatus = Me.__get__('BidderStatus');

  let gravity;

  beforeEach(() => {
    gravity = sinon.stub();
    gravity.with = sinon.stub().returns(gravity);

    Me.__Rewire__('gravity', gravity);
    BidderStatus.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    Me.__ResetDependency__('gravity');
    BidderStatus.__ResetDependency__('gravity');
  });

  it('returns the correct state when you are the high bidder on a work', () => {
    gravity
      // Me fetch
      .onCall(0)
      .returns(Promise.resolve({
        id: 'damon',
        name: 'damon',
      }))
      // SaleArtwork fetch
      .onCall(1)
      .returns(Promise.resolve({
        id: 'untitled',
        highest_bid: {
          id: 'highest-bid-id',
        },
      }))
      // BidderPositions fetch
      .onCall(2)
      .returns(Promise.resolve([
        {
          id: 0,
          max_bid_amount_cents: 90000,
          sale_artwork_id: 'foo',
          highest_bid: null,
        },
        {
          id: 1,
          max_bid_amount_cents: 80000,
          sale_artwork_id: 'foo',
          highest_bid: { id: 'highest-bid-id' },
        },
        {
          id: 2,
          max_bid_amount_cents: 70000,
          sale_artwork_id: 'bar',
          highest_bid: { id: 'not-highest-bid-anymore' },
        },
      ]));

    const query = `
      {
        me {
          bidder_status(artwork_id: "untitled", sale_id: "active-auction") {
            is_highest_bidder
            most_recent_bid {
              id
            }
            active_bid {
              id
            }
          }
        }
      }
    `;

    return graphql(schema, query, { accessToken: 'xxx' })
      .then(({ data: { me } }) => {
        me.should.eql({
          bidder_status: {
            is_highest_bidder: true,
            most_recent_bid: { id: '0' },
            active_bid: { id: '1' },
          },
        });
      });
  });

  it('returns the correct state when you are outbid on a work', () => {
    gravity
      // Me fetch
      .onCall(0)
      .returns(Promise.resolve({
        id: 'damon',
        name: 'damon',
      }))
      // SaleArtwork fetch
      .onCall(1)
      .returns(Promise.resolve({
        id: 'untitled',
        highest_bid: {
          id: 'highest-bid-id',
        },
      }))
      // BidderPositions fetch
      .onCall(2)
      .returns(Promise.resolve([
        {
          id: 0,
          max_bid_amount_cents: 90000,
          sale_artwork_id: 'foo',
          highest_bid: null,
        },
        {
          id: 1,
          max_bid_amount_cents: 80000,
          sale_artwork_id: 'foo',
          highest_bid: { id: 'not-highest-bid-id' },
        },
        {
          id: 2,
          max_bid_amount_cents: 70000,
          sale_artwork_id: 'bar',
          highest_bid: { id: 'not-highest-bid-anymore' },
        },
      ]));

    const query = `
      {
        me {
          bidder_status(artwork_id: "untitled", sale_id: "active-auction") {
            is_highest_bidder
            most_recent_bid {
              id
            }
            active_bid {
              id
            }
          }
        }
      }
    `;

    return graphql(schema, query, { accessToken: 'xxx' })
      .then(({ data: { me } }) => {
        me.should.eql({
          bidder_status: {
            is_highest_bidder: false,
            most_recent_bid: { id: '0' },
            active_bid: null,
          },
        });
      });
  });
});
