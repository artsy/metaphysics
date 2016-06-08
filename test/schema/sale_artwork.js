import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../schema';

describe('SaleArtwork type', () => {
  let gravity;
  const SaleArtwork = schema.__get__('SaleArtwork');

  beforeEach(() => {
    gravity = sinon.stub();

    gravity.returns(Promise.resolve({
      id: 'ed-ruscha-pearl-dust-combination-from-insects-portfolio',
      sale_id: 'los-angeles-modern-auctions-march-2015',
      highest_bid: {
        cancelled: false,
        amount_cents: 325000,
        display_amount_dollars: '€3,250',
      },
      bidder_positions_count: 7,
      highest_bid_amount_cents: 325000,
      display_highest_bid_amount_dollars: '€3,250',
      minimum_next_bid_cents: 350000,
      display_minimum_next_bid_dollars: '€3,500',
      opening_bid_cents: 180000,
      display_opening_bid_dollars: '€1,800',
      low_estimate_cents: 200000,
      display_low_estimate_dollars: '€2,000',
      high_estimate_cents: 300000,
      display_high_estimate_dollars: '€3,000',
      reserve_status: 'reserve_met',
      currency: 'EUR',
      symbol: '€',
    }));

    SaleArtwork.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    SaleArtwork.__ResetDependency__('gravity');
  });

  it('formats money correctly', () => {
    const query = `
      {
        sale_artwork(id: "54c7ed2a7261692bfa910200") {
          high_estimate {
            cents
            amount(format: "%v EUROS!")
            display
          }
          low_estimate {
            cents
            amount
            display
          }
          highest_bid {
            cents
            amount
            display
          }
          current_bid {
            cents
            amount
            display
          }
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        SaleArtwork.__get__('gravity').args[0][0]
          .should.equal('sale_artwork/54c7ed2a7261692bfa910200');
        data.should.eql({
          sale_artwork: {
            high_estimate: {
              cents: 300000,
              amount: '3,000 EUROS!',
              display: '€3,000',
            },
            low_estimate: {
              cents: 200000,
              amount: '€2,000',
              display: '€2,000',
            },
            highest_bid: {
              cents: 325000,
              amount: '€3,250',
              display: '€3,250',
            },
            current_bid: {
              cents: 325000,
              amount: '€3,250',
              display: '€3,250',
            },
          },
        });
      });
  });

  it('can return the bid increment', () => {
    gravity.onCall(1).returns(Promise.resolve([
      {
        key: 'default',
        increments: [
          { from: 0, to: 249999, amount: 1 },
          { from: 350000, to: 500000, amount: 2 },
        ],
      },
    ]));
    const query = `
      {
        sale_artwork(id: "54c7ed2a7261692bfa910200") {
          bid_increment
        }
      }
    `;
    return graphql(schema, query)
      .then(({ data }) => data.sale_artwork.bid_increment.should.equal(2));
  });
});
