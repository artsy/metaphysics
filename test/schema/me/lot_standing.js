describe('LotStanding type', () => {
  const Me = schema.__get__('Me');
  const LotStanding = Me.__get__('LotStanding');

  let gravity;

  beforeEach(() => {
    gravity = sinon.stub();
    gravity.with = sinon.stub().returns(gravity);

    Me.__Rewire__('gravity', gravity);
    LotStanding.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    Me.__ResetDependency__('gravity');
    LotStanding.__ResetDependency__('gravity');
  });

  it('returns the correct state when you are the high bidder and reserve is met', () => {
    gravity
      // Me fetch
      .onCall(0)
      .returns(Promise.resolve({
        id: 'damon',
        name: 'damon',
      }))
      // LotStanding fetch
      .onCall(1)
      .returns(Promise.resolve([
        {
          sale_artwork: {
            id: 'untitled',
            reserve_status: 'reserve_met',
          },
          max_position: {
            id: 0,
            max_bid_amount_cents: 90000,
            sale_artwork_id: 'untitled',
          },
          leading_position: {
            id: 0,
            max_bid_amount_cents: 90000,
            sale_artwork_id: 'untitled',
          },
        },
        {
          sale_artwork: {
            id: 'untitled-2',
            reserve_status: 'reserve_met',
          },
          max_position: {
            id: 1,
            max_bid_amount_cents: 100000,
            sale_artwork_id: 'untitled-2',
          },
          leading_position: {
            id: 2,
            max_bid_amount_cents: 100000,
            sale_artwork_id: 'untitled-2',
          },
        },
      ]));

    const query = `
      {
        me {
          lot_standing(artwork_id: "untitled", sale_id: "active-auction") {
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

    return runAuthenticatedQuery(query)
      .then(({ me }) => {
        expect(me).toEqual({
          lot_standing: {
            is_highest_bidder: true,
            most_recent_bid: { id: '0' },
            active_bid: { id: '0' },
          },
        });
      });
  });

  it('returns the correct state when you are outbid on a work & reserve is met', () => {
    gravity
      // Me fetch
      .onCall(0)
      .returns(Promise.resolve({
        id: 'damon',
        name: 'damon',
      }))
      // LotStanding fetch
      .onCall(1)
      .returns(Promise.resolve([
        {
          sale_artwork: {
            id: 'untitled',
            reserve_status: 'reserve_met',
          },
          max_position: {
            id: 0,
            max_bid_amount_cents: 90000,
            sale_artwork_id: 'untitled',
          },
          leading_position: null,
        },
      ]));

    const query = `
      {
        me {
          lot_standing(artwork_id: "untitled", sale_id: "active-auction") {
            is_highest_bidder
            is_leading_bidder
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

    return runAuthenticatedQuery(query)
      .then(({ me }) => {
        expect(me).toEqual({
          lot_standing: {
            is_highest_bidder: false,
            is_leading_bidder: false,
            most_recent_bid: { id: '0' },
            active_bid: null,
          },
        });
      });
  });

  it('returns the correct state when you are the top bid but reserve is not met', () => {
    gravity
      // Me fetch
      .onCall(0)
      .returns(Promise.resolve({
        id: 'damon',
        name: 'damon',
      }))
      // LotStanding fetch
      .onCall(1)
      .returns(Promise.resolve([
        {
          sale_artwork: {
            id: 'untitled',
            reserve_status: 'reserve_not_met',
          },
          max_position: {
            id: 0,
            max_bid_amount_cents: 90000,
            sale_artwork_id: 'untitled',
          },
          leading_position: {
            id: 0,
            max_bid_amount_cents: 90000,
            sale_artwork_id: 'untitled',
          },
        },
      ]));

    const query = `
      {
        me {
          lot_standing(artwork_id: "untitled", sale_id: "active-auction") {
            is_highest_bidder
            is_leading_bidder
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

    return runAuthenticatedQuery(query)
      .then(({ me }) => {
        expect(me).toEqual({
          lot_standing: {
            is_highest_bidder: false,
            is_leading_bidder: true,
            most_recent_bid: { id: '0' },
            active_bid: null,
          },
        });
      });
  });
});
