import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../schema';
import {
  map,
} from 'lodash';

describe('Me type', () => {
  const Me = schema.__get__('Me');
  const BidderPosition = Me.__get__('BidderPosition');

  beforeEach(() => {
    const gravity = sinon.stub();
    const gravity2 = sinon.stub();
    gravity.with = sinon.stub().returns(gravity);

    gravity
      .onCall(0)
      .returns(Promise.resolve({
        id: 'craig',
        name: 'craig',
      }))
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
      ]))
      .onCall(3)
      .returns(Promise.resolve({
        id: '123',
        artwork: { title: 'Andy Warhol Skull' },
      }));
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
        map(data.me.bidder_positions, 'id').join('').should.eql('0123');
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
        map(data.me.bidder_positions, 'id').join('').should.eql('12');
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
