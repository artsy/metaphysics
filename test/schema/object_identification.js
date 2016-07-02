import sinon from 'sinon';
import { graphql } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import schema from '../../schema';

describe('Global Identification', () => {
  const Article = schema.__get__('Article');
  const Artist = schema.__get__('Artist');
  const Artwork = schema.__get__('Artwork');
  const PartnerShow = schema.__get__('PartnerShow');
  const ObjectIdentification = schema.__get__('ObjectIdentification');

  afterEach(() => {
    Article.__ResetDependency__('positron');
    Artist.__ResetDependency__('gravity');
    Artwork.__ResetDependency__('gravity');
    PartnerShow.__ResetDependency__('gravity');
    ObjectIdentification.__ResetDependency__('gravity');
  });

  describe('for an Article', () => {
    beforeEach(() => {
      [Article, ObjectIdentification].forEach((mod) => {
        mod.__Rewire__('positron', sinon.stub().returns(
          Promise.resolve({
            id: 'foo-bar',
            title: 'Nightlife at the Foo Bar',
            author: 'Artsy Editorial',
          })
        ));
      });
    });

    it('generates a Global ID', () => {
      const query = `
        {
          article(id: "foo-bar") {
            __id
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            article: {
              __id: toGlobalId('Article', 'foo-bar'),
            },
          });
        });
    });

    it('resolves a node', () => {
      const query = `
        {
          node(__id: "${toGlobalId('Article', 'foo-bar')}") {
            __typename
            ... on Article {
              id
            }
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            node: {
              __typename: 'Article',
              id: 'foo-bar',
            },
          });
        });
    });
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

  describe('for a PartnerShow', () => {
    beforeEach(() => {
      [PartnerShow, ObjectIdentification].forEach((mod) => {
        mod.__Rewire__('gravity', sinon.stub().returns(
          Promise.resolve({
            id: 'foo-bar',
            displayable: true,
            partner: { id: 'for-baz' },
            display_on_partner_profile: true,
          })
        ));
      });
    });

    it('generates a Global ID', () => {
      const query = `
        {
          partner_show(id: "foo-bar") {
            __id
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            partner_show: {
              __id: toGlobalId('PartnerShow', 'foo-bar'),
            },
          });
        });
    });

    it('resolves a node', () => {
      const query = `
        {
          node(__id: "${toGlobalId('PartnerShow', 'foo-bar')}") {
            __typename
            ... on PartnerShow {
              id
            }
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            node: {
              __typename: 'PartnerShow',
              id: 'foo-bar',
            },
          });
        });
    });
  });
});
