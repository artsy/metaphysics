import {
  map,
  times,
} from 'lodash';

describe('Me type', () => {
  const Me = schema.__get__('Me');
  const BidderPositions = Me.__get__('BidderPositions');
  const BidderPosition = BidderPositions.__get__('BidderPosition');

  let gravity;
  let gravity2;

  beforeEach(() => {
    gravity = sinon.stub();
    gravity2 = sinon.stub();
    gravity.with = sinon.stub().returns(gravity);

    gravity
      // Me fetch
      .onCall(0)
      .returns(Promise.resolve({
        id: 'craig',
        name: 'craig',
      }))
      // Bidder positions fetch
      .onCall(1)
      .returns(Promise.resolve([
        {
          id: 0,
          max_bid_amount_cents: 1000000,
          sale_artwork_id: 'foo',
          highest_bid: null,
        },
        {
          id: 1,
          max_bid_amount_cents: 1000000,
          sale_artwork_id: 'foo',
          highest_bid: { id: 'hb1' },
        },
        {
          id: 2,
          max_bid_amount_cents: 1000000,
          sale_artwork_id: 'bar',
          highest_bid: { id: 'hb2' },
        },
        {
          id: 3,
          max_bid_amount_cents: 1000000,
          sale_artwork_id: 'foo',
          highest_bid: { id: 'hb13' },
        },
        {
          id: 4,
          max_bid_amount_cents: 1000000,
          sale_artwork_id: 'baz',
          highest_bid: { id: 'hb4' },
        },
      ]));
    // Sale artworks fetches
    times(3, (i) => {
      let id;
      if (i === 0) id = 'foo';
      if (i === 1) id = 'bar';
      if (i === 2) id = 'baz';
      gravity.onCall(i + 2)
      .returns(Promise.resolve({
        id,
        _id: id,
        artwork: { title: 'Andy Warhol Skull' },
        sale_id: i === 1 ? 'bar-auction' : 'else-auction',
      }));
    });
    // Sale fetches
    times(3, (i) => {
      gravity.onCall(i + 5)
      .returns(Promise.resolve({
        id: i === 1 ? 'bar-auction' : 'else-auction',
        auction_state: i === 1 ? 'closed' : 'open',
      }));
    });
    // Sale artwork fetch used in `is_winning` property
    gravity2.returns(Promise.resolve({
      id: '456',
      highest_bid: { id: 'hb2' },
      artwork: { title: 'Andy Warhol Skull' },
    }));

    Me.__Rewire__('gravity', gravity);
    BidderPositions.__Rewire__('gravity', gravity);
    BidderPosition.__Rewire__('gravity', gravity2);
  });

  afterEach(() => {
    Me.__ResetDependency__('gravity');
    BidderPositions.__ResetDependency__('gravity');
    BidderPosition.__ResetDependency__('gravity');
  });

  it('returns all bidder positions', () => {
    const query = `
      {
        me {
          bidder_positions {
            id
          }
        }
      }
    `;
    return runAuthenticatedQuery(query)
      .then(data => {
        expect(Me.__get__('gravity').args[1][0]).toBe('me/bidder_positions');
        expect(map(data.me.bidder_positions, 'id').join('')).toEqual('01234');
      });
  });

  it('can return only current bidder positions', () => {
    const query = `
      {
        me {
          bidder_positions(current: true) {
            id
          }
        }
      }
    `;
    return runAuthenticatedQuery(query)
      .then(data => {
        expect(Me.__get__('gravity').args[1][0]).toBe('me/bidder_positions');
        expect(map(data.me.bidder_positions, 'id').join('')).toEqual('14');
      });
  });

  it('does not fail for bidder positions with unpublished artworks', () => {
    const query = `
      {
        me {
          bidder_positions(current: true) {
            id
          }
        }
      }
    `;
    gravity.onCall(4).returns(Promise.reject(new Error('Forbidden')));
    return runAuthenticatedQuery(query)
      .then(data => {
        expect(map(data.me.bidder_positions, 'id').join('')).toEqual('1');
      });
  });

  it('bidder positions can return is_winning based on sale artwork', () => {
    const query = `
      {
        me {
          bidder_positions {
            id
            is_winning
          }
        }
      }
    `;
    return runAuthenticatedQuery(query)
      .then(data => {
        expect(Me.__get__('gravity').args[1][0]).toBe('me/bidder_positions');
        expect(data.me.bidder_positions[2].is_winning).toEqual(true);
      });
  });
});
