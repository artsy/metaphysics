import _ from 'lodash';
import sinon from 'sinon';
import { graphql } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import schema from '../../schema';

describe('Object Identification', () => {
  const tests = {
    Article: {
      positron: {
        title: 'Nightlife at the Foo Bar',
        author: 'Artsy Editorial',
      },
    },
    Artist: {
      gravity: {
        birthday: null,
        artworks_count: 42,
      },
    },
    Artwork: {
      gravity: {
        title: 'For baz',
        artists: null,
      },
    },
    Partner: {
      gravity: {
        has_full_profile: true,
        shows_count: 42,
      },
    },
    PartnerShow: {
      gravity: {
        displayable: true, // this is only so that the show doesn’t get rejected
        partner: { id: 'for-baz' },
        display_on_partner_profile: true,
      },
    },
  };

  _.keys(tests).forEach((typeName) => {
    describe(`for a ${typeName}`, () => {
      const fieldName = _.snakeCase(typeName);
      const type = schema.__get__(typeName);
      const api = _.keys(tests[typeName])[0];
      const payload = tests[typeName][api];

      beforeEach(() => {
        type.__Rewire__(api, sinon.stub().returns(
          Promise.resolve(_.assign({ id: 'foo-bar' }, payload))
        ));
      });

      afterEach(() => {
        type.__ResetDependency__(api);
      });

      it('generates a Global ID', () => {
        const query = `
          {
            ${fieldName}(id: "foo-bar") {
              __id
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          const expectedData = {};
          expectedData[fieldName] = { __id: toGlobalId(typeName, 'foo-bar') };
          data.should.eql(expectedData);
        });
      });

      it('resolves a node', () => {
        const query = `
          {
            node(__id: "${toGlobalId(typeName, 'foo-bar')}") {
              __typename
              ... on ${typeName} {
                id
              }
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          data.should.eql({
            node: {
              __typename: typeName,
              id: 'foo-bar',
            },
          });
        });
      });
    });
  });

  describe('for a HomePageModule', () => {
    describe('with a specific module', () => {
      const globalId = toGlobalId('HomePageModules', JSON.stringify({ key: 'iconic_artists' }));

      it('generates a Global ID', () => {
        const query = `
          {
            home_page_module(key: "iconic_artists") {
              __id
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          data.should.eql({
            home_page_module: {
              __id: globalId,
            }
          });
        });
      });

      it('resolves a node', () => {
        const query = `
          {
            node(__id: "${globalId}") {
              __typename
              ... on HomePageModules {
                key
              }
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          data.should.eql({
            node: {
              __typename: 'HomePageModules',
              key: 'iconic_artists',
            },
          });
        });
      });
    });

    describe('with a generic gene', () => {
      const globalId = toGlobalId('HomePageModules', JSON.stringify({ key: 'generic_gene', id: 'abstract-art' }));

      it('generates a Global ID', () => {
        const query = `
          {
            home_page_module(key: "generic_gene", id: "abstract-art") {
              __id
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          data.should.eql({
            home_page_module: {
              __id: globalId,
            }
          });
        });
      });

      it('resolves a node', () => {
        const query = `
          {
            node(__id: "${globalId}") {
              __typename
              ... on HomePageModules {
                key
                params {
                  id
                }
              }
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          data.should.eql({
            node: {
              __typename: 'HomePageModules',
              key: 'generic_gene',
              params: {
                id: 'abstract-art',
              },
            },
          });
        });
      });
    });
  });
});
