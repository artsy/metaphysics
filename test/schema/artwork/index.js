import _ from 'lodash';
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
        .returns(Promise.resolve(_.assign({}, artwork, {
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
        .returns(Promise.resolve(_.assign({}, artwork, {
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
          _.assign({}, sale, { is_auction: false }),
          _.assign({}, sale, { is_auction: true }),
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
          _.assign({}, sale, { is_auction: false }),
          _.assign({}, sale, { is_auction: false }),
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
          _.assign({}, sale, { name: 'Y2K', end_at: moment.utc('1999-12-31').format() }),
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
});
