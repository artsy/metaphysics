import { assign } from 'lodash';
import sinon from 'sinon';
import moment from 'moment';
import { graphql } from 'graphql';
import schema from '../../../schema';

describe('Artwork type', () => {
  let gravity;
  const Artwork = schema.__get__('Artwork');

  const partner = { id: 'existy' };
  const sale = { id: 'existy' };

  const artwork = {
    id: 'richard-prince-untitled-portrait',
    title: 'Untitled (Portrait)',
    forsale: true,
    acquireable: false,
  };

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
    gravity = sinon.stub();
    Artwork.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    Artwork.__ResetDependency__('gravity');
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

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
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

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_contactable: false,
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

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
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

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
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
        .returns(Promise.resolve([
          assign({}, sale, { is_auction: false }),
          assign({}, sale, { is_auction: false }),
        ]));

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            artwork: {
              id: 'richard-prince-untitled-portrait',
              is_in_auction: false,
            },
          });
        });
    });
  });

  describe('#related', () => {
    it('returns either one fair or sale', () => {
      gravity
        // Artwork
        .onCall(0)
        .returns(Promise.resolve(artwork))
        // Fairs
        .onCall(1)
        .returns(Promise.resolve([]))
        // Sales
        .onCall(2)
        .returns(Promise.resolve([
          assign({}, sale, { name: 'Y2K', end_at: moment.utc('1999-12-31').format() }),
        ]));

      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            banner: related {
              __typename
              ... on RelatedSale {
                name
                href
                end_at(format: "D:M:YYYY")
              }
              ... on RelatedFair {
                name
                href
              }
            }
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.artwork.banner.should.eql({
            __typename: 'RelatedSale',
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

      const response = assign({}, artwork, { can_share_image: false });

      beforeEach(() => gravity.returns(Promise.resolve(response)));

      it('returns false if the artwork is not shareable', () => {
        return graphql(schema, query)
          .then(({ data }) => data.artwork.is_shareable.should.be.false());
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
          return graphql(schema, query)
            .then(({ data }) => data.artwork.is_hangable.should.be.true());
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
          return graphql(schema, query)
            .then(({ data }) => data.artwork.is_hangable.should.be.false());
        });

        it('is not hangable if the work is 3d', () => {
          const response = assign({ width: 100, height: 100, depth: 100 }, artwork);
          gravity.returns(Promise.resolve(response));
          return graphql(schema, query)
            .then(({ data }) => data.artwork.is_hangable.should.be.false());
        });

        it('is not hangable if the dimensions are unreasonably large', () => {
          const response = assign({ width: '10000', height: '10000', metric: 'cm' }, artwork);
          gravity.returns(Promise.resolve(response));
          return graphql(schema, query)
            .then(({ data }) => data.artwork.is_hangable.should.be.false());
        });

        it('is not hangable if there is no dimensions', () => {
          const response = assign({ dimensions: {} }, artwork);
          gravity.returns(Promise.resolve(response));
          return graphql(schema, query)
            .then(({ data }) => data.artwork.is_hangable.should.be.false());
        });
      });
    });
  });
});
