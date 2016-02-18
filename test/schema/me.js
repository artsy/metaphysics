import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../schema';
import {
  map,
  times,
} from 'lodash';

describe('Me type', () => {
  const Me = schema.__get__('Me');
  const BidderPosition = Me.__get__('BidderPosition');

  beforeEach(() => {
    const gravity = sinon.stub();
    const gravity2 = sinon.stub();
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
        sale_id: i,
      }));
    });
    // Sale fetches
    times(3, (i) => {
      gravity.onCall(i + 5)
      .returns(Promise.resolve({
        id: i,
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
    BidderPosition.__Rewire__('gravity', gravity2);
  });

  afterEach(() => {
    Me.__ResetDependency__('gravity');
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
    return graphql(schema, query, { accessToken: 'foo' })
      .then(({ data }) => {
        Me.__get__('gravity').args[1][0].should.equal('me/bidder_positions');
        map(data.me.bidder_positions, 'id').join('').should.eql('01234');
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
    return graphql(schema, query, { accessToken: 'foo' })
      .then(({ data }) => {
        Me.__get__('gravity').args[1][0].should.equal('me/bidder_positions');
        map(data.me.bidder_positions, 'id').join('').should.eql('14');
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
    return graphql(schema, query, { accessToken: 'foo' })
      .then(({ data }) => {
        Me.__get__('gravity').args[1][0].should.equal('me/bidder_positions');
        data.me.bidder_positions[2].is_winning.should.eql(true);
      });
  });
});
