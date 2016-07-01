import sinon from 'sinon';
import { graphql } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import schema from '../../schema';

describe('Global Identification', () => {
  const Artist = schema.__get__('Artist');
  const Artwork = schema.__get__('Artwork');
  const ObjectIdentification = schema.__get__('ObjectIdentification');

  afterEach(() => {
    Artist.__ResetDependency__('gravity');
    Artwork.__ResetDependency__('gravity');
    ObjectIdentification.__ResetDependency__('gravity');
  });

  describe('for an Artist', () => {
    beforeEach(() => {
      [Artist, ObjectIdentification].forEach((mod) => {
        mod.__Rewire__('gravity', sinon.stub().returns(
          Promise.resolve({
            id: 'foo-bar',
            birthday: null,
            artworks_count: 42,
          })
        ));
      });
    });

    it('generates a Global ID', () => {
      const query = `
        {
          artist(id: "foo-bar") {
            __id
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            artist: {
              __id: toGlobalId('Artist', 'foo-bar'),
            },
          });
        });
    });

    it('resolves a node', () => {
      const query = `
        {
          node(__id: "${toGlobalId('Artist', 'foo-bar')}") {
            __typename
            ... on Artist {
              id
            }
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            node: {
              __typename: 'Artist',
              id: 'foo-bar',
            },
          });
        });
    });
  });

  describe('for an Artwork', () => {
    beforeEach(() => {
      [Artwork, ObjectIdentification].forEach((mod) => {
        mod.__Rewire__('gravity', sinon.stub().returns(
          Promise.resolve({
            id: 'foo-bar',
            title: 'For baz',
            artists: null,
          })
        ));
      });
    });

    it('generates a Global ID', () => {
      const query = `
        {
          artwork(id: "foo-bar") {
            __id
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            artwork: {
              __id: toGlobalId('Artwork', 'foo-bar'),
            },
          });
        });
    });

    it('resolves a node', () => {
      const query = `
        {
          node(__id: "${toGlobalId('Artwork', 'foo-bar')}") {
            __typename
            ... on Artwork {
              id
            }
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            node: {
              __typename: 'Artwork',
              id: 'foo-bar',
            },
          });
        });
    });
  });
});
