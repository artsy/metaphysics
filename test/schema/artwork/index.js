import { assign } from 'lodash';
import moment from 'moment';

describe('Artwork type', () => {
  let gravity;
  const Artwork = schema.__get__('Artwork');
  const Context = Artwork.__get__('Context');

  const partner = { id: 'existy' };
  const sale = { id: 'existy' };

  let artwork = null;

  const artworkImages = [
    {
      is_default: false,
      id: '56b6311876143f4e82000188',
      image_url: 'https://xxx.cloudfront.net/xxx/:version.jpg',
      image_versions: [
        'icon',
        'large',
      ],
      image_urls: {
        icon: 'https://xxx.cloudfront.net/xxx/icon.png',
        large: 'https://xxx.cloudfront.net/xxx/large.jpg',
      },
    },
    {
      is_default: true,
      id: '56b64ed2cd530e670c0000b2',
      image_url: 'https://xxx.cloudfront.net/xxx/:version.jpg',
      image_versions: [
        'icon',
        'large',
      ],
      image_urls: {
        icon: 'https://xxx.cloudfront.net/xxx/icon.png',
        large: 'https://xxx.cloudfront.net/xxx/large.jpg',
      },
    },
  ];

  beforeEach(() => {
    artwork = {
      id: 'richard-prince-untitled-portrait',
      title: 'Untitled (Portrait)',
      forsale: true,
      acquireable: false,
      artists: [],
      sale_ids: ['sale-id-not-auction', 'sale-id-auction'],
    };
    gravity = sinon.stub();
    Artwork.__Rewire__('gravity', gravity);
    Context.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    Artwork.__ResetDependency__('gravity');
    Context.__ResetDependency__('gravity');
  });

  describe('#is_contactable', () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          id
          is_contactable
        }
      }
    `;

    it('is contactable if it meets all requirements', () => {
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork, {
          partner,
        })))
        // Sales
        .onCall(1)
        .returns(Promise.resolve([]));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_contactable: true,
            },
          });
        });
    });

    it('is not contactable if it has related sales', () => {
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork, {
          partner,
        })))
        // Sales
        .onCall(1)
        .returns(Promise.resolve([sale]));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_contactable: false,
            },
          });
        });
    });
  });

  describe('#is_purchasable', () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          id
          is_purchasable
        }
      }
    `;

    it('is purchasable if it is inquireable with an exact price', () => {
      artwork.inquireable = true;
      artwork.price = '$420';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_purchasable: true,
            },
          });
        });
    });

    it('is not purchasable if it has multiple edition sets', () => {
      artwork.inquireable = true;
      artwork.price = '$420';
      artwork.edition_sets = [{}];
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_purchasable: false,
            },
          });
        });
    });

    it('is not purchasable if it is inquireable without an exact price', () => {
      artwork.inquireable = true;
      artwork.price = '$420 - $500';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_purchasable: false,
            },
          });
        });
    });

    it('is not purchasable if it is not inquireable with an exact price', () => {
      artwork.inquireable = false;
      artwork.price = '$420';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_purchasable: false,
            },
          });
        });
    });

    it('is not purchasable if it is inquireable with a blank price', () => {
      artwork.inquireable = true;
      artwork.price = '';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_purchasable: false,
            },
          });
        });
    });

    it('is not purchasable if it is inquireable w/ an exact price but not for sale', () => {
      artwork.inquireable = true;
      artwork.price = '$420';
      artwork.forsale = false;
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_purchasable: false,
            },
          });
        });
    });
  });

  describe('#images', () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          image {
            id
          }
        }
      }
    `;

    it('returns the first default image', () => {
      gravity
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork, { images: artworkImages })));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              image: {
                id: '56b64ed2cd530e670c0000b2',
              },
            },
          });
        });
    });
  });

  describe('#is_in_auction', () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          id
          is_in_auction
        }
      }
    `;

    it('is true if the artwork has any sales that are auctions', () => {
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork))
        // Sales
        .onCall(1)
        .returns(Promise.resolve([
          assign({}, sale, { is_auction: false }),
          assign({}, sale, { is_auction: true }),
        ]));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_in_auction: true,
            },
          });
        });
    });

    it('is false if the artwork is not in any sales that are auctions', () => {
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork))
        // Sales
        .onCall(1)
        .returns(Promise.resolve([]));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_in_auction: false,
            },
          });
        });
    });
  });

  describe('#sale_message', () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          id
          sale_message
        }
      }
    `;

    it('returns "On hold" if work is on hold with no price', () => {
      artwork.sale_message = 'Not for sale';
      artwork.price = null;
      artwork.availability = 'on hold';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              sale_message: 'On hold',
            },
          });
        });
    });

    it('returns "[Price], on hold" if work is on hold with a price', () => {
      artwork.sale_message = 'Not for sale';
      artwork.price = '$420,000';
      artwork.availability = 'on hold';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              sale_message: '$420,000, on hold',
            },
          });
        });
    });

    it('returns "Sold" if work is sold', () => {
      artwork.sale_message = '$420,000 - Sold';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              sale_message: 'Sold',
            },
          });
        });
    });

    it('returns null if work is not for sale', () => {
      artwork.availability = 'not for sale';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              sale_message: null,
            },
          });
        });
    });

    it('returns the gravity sale_message if for sale', () => {
      artwork.availability = 'for sale';
      artwork.sale_message = 'something from gravity';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              sale_message: 'something from gravity',
            },
          });
        });
    });
  });

  describe('#contact_message', () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          id
          contact_message
        }
      }
    `;

    it('returns custom text for an auction partner type', () => {
      artwork.partner = { type: 'Auction' };
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              contact_message: 'Hello, I am interested in placing a bid on this work. Please send me more information.', // eslint-disable-line max-len
            },
          });
        });
    });

    it('returns custom text for a sold work', () => {
      artwork.availability = 'sold';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              contact_message: 'Hi, I’m interested in similar works by this artist. Could you please let me know if you have anything available?', // eslint-disable-line max-len
            },
          });
        });
    });

    it('returns custom text for an on hold work', () => {
      artwork.availability = 'on hold';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              contact_message: 'Hi, I’m interested in purchasing this work. Could you please provide more information about the piece?', // eslint-disable-line max-len
            },
          });
        });
    });

    it('returns nothing for a not for sale work', () => {
      artwork.availability = 'not for sale';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              contact_message: null,
            },
          });
        });
    });
  });

  describe('#is_biddable', () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          id
          is_biddable
        }
      }
    `;

    it('is true if the artwork has any sales that are open auctions', () => {
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork))
        // Sales
        .onCall(1)
        .returns(Promise.resolve([{}]));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_biddable: true,
            },
          });
        });
    });

    it('is false if the artwork is not in any sales that are auctions', () => {
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork))
        // Sales
        .onCall(1)
        .returns(Promise.resolve([]));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_biddable: false,
            },
          });
        });
    });
  });

  describe('#is_buy_nowable', () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          id
          is_buy_nowable
        }
      }
    `;

    it('is true if the artwork is acquireable and in an open auction with no bids', () => {
      artwork.acquireable = true;
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)))
        // Sales
        .onCall(1)
        .returns(Promise.resolve([{ id: 'sale-id' }]))
        // Sale Artwork
        .onCall(2)
        .returns(Promise.resolve({ bidder_positions_count: 0 }));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_buy_nowable: true,
            },
          });
        });
    });
  });

  describe('#context', () => {
    it('returns either one Fair, Sale, or PartnerShow', () => {
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork))
        // Sales
        .onCall(1)
        .returns(Promise.resolve([
          assign({}, sale, {
            is_auction: true,
            name: 'Y2K',
            end_at: moment.utc('1999-12-31').format(),
          }),
        ]))
        // Fairs
        .onCall(2)
        .returns(Promise.resolve([]))
        .onCall(3)
        .returns(Promise.resolve([]));

      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            banner: context {
              __typename
              ... on ArtworkContextAuction {
                name
                href
                end_at(format: "D:M:YYYY")
              }
              ... on ArtworkContextFair {
                name
                href
              }
            }
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data.artwork.banner).toEqual({
            __typename: 'ArtworkContextAuction',
            name: 'Y2K',
            href: '/auction/existy',
            end_at: '31:12:1999',
          });
        });
    });
  });

  describe('predicates', () => {
    describe('#is_shareable', () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            id
            is_shareable
          }
        }
      `;

      it('returns false if the artwork is not shareable', () => {
        artwork.can_share_image = false;
        gravity
          // Artwork
          .onCall(0)
          .returns(Promise.resolve(assign({}, artwork)));

        return runQuery(query)
          .then(data => {
            expect(data.artwork.is_shareable).toBe(false);
          });
      });
    });

    describe('#is_hangable', () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            id
            is_hangable
          }
        }
      `;

      describe('if the artwork is able to be used with "View in Room"', () => {
        it('is hangable if the artwork is 2d and has reasonable dimensions', () => {
          const response = assign({ width: 100, height: 100 }, artwork);
          gravity.returns(Promise.resolve(response));
          return runQuery(query)
            .then(data => {
              expect(data.artwork.is_hangable).toBe(true);
            });
        });
      });

      describe('if the artwork is not able to be used with "View in Room"', () => {
        it('is not hangable if the category is not applicable to wall display', () => {
          const response = assign({
            category: 'sculpture',
            width: 100,
            height: 100,
          }, artwork);
          gravity.returns(Promise.resolve(response));
          return runQuery(query)
            .then(data => {
              expect(data.artwork.is_hangable).toBe(false);
            });
        });

        it('is not hangable if the work is 3d', () => {
          const response = assign({ width: 100, height: 100, depth: 100 }, artwork);
          gravity.returns(Promise.resolve(response));
          return runQuery(query)
            .then(data => {
              expect(data.artwork.is_hangable).toBe(false);
            });
        });

        it('is not hangable if the dimensions are unreasonably large', () => {
          const response = assign({ width: '10000', height: '10000', metric: 'cm' }, artwork);
          gravity.returns(Promise.resolve(response));
          return runQuery(query)
            .then(data => {
              expect(data.artwork.is_hangable).toBe(false);
            });
        });

        it('is not hangable if there is no dimensions', () => {
          const response = assign({ dimensions: {} }, artwork);
          gravity.returns(Promise.resolve(response));
          return runQuery(query)
            .then(data => {
              expect(data.artwork.is_hangable).toBe(false);
            });
        });
      });
    });
  });

  describe('markdown fields', () => {
    describe('#signature', () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            id
            signature(format: HTML)
          }
        }
      `;

      it('removes the hardcoded signature label if present', () => {
        artwork.signature = 'Signature: Foo *bar*';
        gravity
          // Artwork
          .onCall(0)
          .returns(Promise.resolve(assign({}, artwork)));

        return runQuery(query)
          .then(({ artwork: { signature } }) => {
            expect(signature).toBe('<p>Foo <em>bar</em></p>\n');
          });
      });
    });
  });

  describe('#is_price_range', () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          id
          is_price_range
        }
      }
    `;

    it('returns true if artwork price is a range.', () => {
      artwork.price = '$200 - $300';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_price_range: true,
            },
          });
        });
    });

    it('returns false if artwork price is not a range.', () => {
      artwork.price = '$1000';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_price_range: false,
            },
          });
        });
    });

    it('returns false if artwork price is a range with multiple editions.', () => {
      artwork.price = '$200 - $300';
      artwork.edition_sets = [{}];
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_price_range: false,
            },
          });
        });
    });
  });

  describe('A title', () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          title
        }
      }
    `;

    it('is Untitled when its title is null', () => {
      artwork.title = null;
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              title: 'Untitled',
            },
          });
        });
    });

    it('is Untitled title when its title is empty', () => {
      artwork.title = '';
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(assign({}, artwork)));

      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            artwork: {
              title: 'Untitled',
            },
          });
        });
    });
  });
});
