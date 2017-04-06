import _ from 'lodash';
import { toGlobalId } from 'graphql-relay';

describe('Object Identification', () => {
  // TODO As we add more loaders, remove the old tests at the bottom of this file and add them here.
  const loaderTests = {
    Artist: {
      artistLoader: {
        id: 'foo-bar',
        birthday: null,
        artworks_count: 42,
      },
    },
    Artwork: {
      artworkLoader: {
        id: 'foo-bar',
        title: 'Foo Bar',
        artists: null,
      },
    },
  };

  _.keys(loaderTests).forEach(typeName => {
    const fieldName = _.snakeCase(typeName);
    const loaderName = _.keys(loaderTests[typeName])[0];
    const payload = loaderTests[typeName][loaderName];
    const rootValue = {
      [loaderName]: sinon.stub().withArgs(payload.id).returns(Promise.resolve(payload)),
    };

    describe(`for a ${typeName}`, () => {
      it('generates a Global ID', () => {
        const query = `
          {
            ${fieldName}(id: "foo-bar") {
              __id
            }
          }
        `;

        return runQuery(query, rootValue).then(data => {
          const expectedData = {};
          expectedData[fieldName] = { __id: toGlobalId(typeName, 'foo-bar') };
          expect(data).toEqual(expectedData);
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

        return runQuery(query, rootValue).then(data => {
          expect(data).toEqual({
            node: {
              __typename: typeName,
              id: 'foo-bar',
            },
          });
        });
      });
    });
  });

  const tests = {
    Article: {
      positron: {
        title: 'Nightlife at the Foo Bar',
        author: 'Artsy Editorial',
      },
    },
    Partner: {
      gravity: {
        has_full_profile: true,
        profile_banner_display: false,
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

        return runQuery(query).then(data => {
          const expectedData = {};
          expectedData[fieldName] = { __id: toGlobalId(typeName, 'foo-bar') };
          expect(data).toEqual(expectedData);
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

        return runQuery(query).then(data => {
          expect(data).toEqual({
            node: {
              __typename: typeName,
              id: 'foo-bar',
            },
          });
        });
      });
    });
  });

  describe('for the Me field', () => {
    const globalId = toGlobalId(
      'Me',
      '5501de167261696e34610200'
    );

    const me = schema.__get__('Me');
    let gravity;

    beforeEach(() => {
      gravity = sinon.stub().returns(Promise.resolve({
        id: '5501de167261696e34610200',
        email: 'email@artsy.net',
        is_collector: true,
      }));
      gravity.with = () => gravity;
      me.__Rewire__('gravity', gravity);
    });

    afterEach(() => {
      me.__ResetDependency__('gravity');
    });

    it('generates a Global ID', () => {
      const query = `
        {
          me {
            __id
          }
        }
      `;

      return runAuthenticatedQuery(query).then(data => {
        expect(data).toEqual({
          me: {
            __id: globalId,
          },
        });
      });
    });

    it('resolves a node', () => {
      const query = `
        {
          node(__id: "${globalId}") {
            __typename
            ... on Me {
              id
            }
          }
        }
      `;

      return runAuthenticatedQuery(query).then(data => {
        expect(data).toEqual({
          node: {
            __typename: 'Me',
            id: '5501de167261696e34610200',
          },
        });
      });
    });
  });

  describe('for a HomePageArtworkModule', () => {
    describe('with a specific module', () => {
      const globalId = toGlobalId(
        'HomePageArtworkModule',
        JSON.stringify({ key: 'popular_artists' })
      );

      it('generates a Global ID', () => {
        const query = `
          {
            home_page {
              artwork_module(key: "popular_artists") {
                __id
              }
            }
          }
        `;

        return runQuery(query).then(data => {
          expect(data).toEqual({
            home_page: {
              artwork_module: {
                __id: globalId,
              },
            },
          });
        });
      });

      it('resolves a node', () => {
        const query = `
          {
            node(__id: "${globalId}") {
              __typename
              ... on HomePageArtworkModule {
                key
              }
            }
          }
        `;

        return runQuery(query).then(data => {
          expect(data).toEqual({
            node: {
              __typename: 'HomePageArtworkModule',
              key: 'popular_artists',
            },
          });
        });
      });
    });

    describe('with a generic gene', () => {
      const globalId = toGlobalId(
        'HomePageArtworkModule',
        JSON.stringify({ id: 'abstract-art', key: 'generic_gene' })
      );

      it('generates a Global ID', () => {
        const query = `
          {
            home_page {
              artwork_module(key: "generic_gene", id: "abstract-art") {
                __id
              }
            }
          }
        `;

        return runQuery(query).then(data => {
          expect(data).toEqual({
            home_page: {
              artwork_module: {
                __id: globalId,
              },
            },
          });
        });
      });

      it('resolves a node', () => {
        const query = `
          {
            node(__id: "${globalId}") {
              __typename
              ... on HomePageArtworkModule {
                key
                params {
                  id
                }
              }
            }
          }
        `;

        return runQuery(query).then(data => {
          expect(data).toEqual({
            node: {
              __typename: 'HomePageArtworkModule',
              key: 'generic_gene',
              params: {
                id: 'abstract-art',
              },
            },
          });
        });
      });
    });

    describe('with a related artist', () => {
      const globalId = toGlobalId(
        'HomePageArtworkModule',
        JSON.stringify({
          followed_artist_id: 'pablo-picasso',
          related_artist_id: 'charles-broskoski',
          key: 'related_artists',
        })
      );

      it('generates a Global ID', () => {
        const query = `
          {
            home_page {
              artwork_module(key: "related_artists",
                             related_artist_id: "charles-broskoski",
                             followed_artist_id: "pablo-picasso") {
                __id
              }
            }
          }
        `;

        return runQuery(query).then(data => {
          expect(data).toEqual({
            home_page: {
              artwork_module: {
                __id: globalId,
              },
            },
          });
        });
      });

      it('resolves a node', () => {
        const query = `
          {
            node(__id: "${globalId}") {
              __typename
              ... on HomePageArtworkModule {
                key
                params {
                  related_artist_id
                  followed_artist_id
                }
              }
            }
          }
        `;

        return runQuery(query).then(data => {
          expect(data).toEqual({
            node: {
              __typename: 'HomePageArtworkModule',
              key: 'related_artists',
              params: {
                related_artist_id: 'charles-broskoski',
                followed_artist_id: 'pablo-picasso',
              },
            },
          });
        });
      });
    });
  });

  describe('for a HomePageArtistModule', () => {
    const globalId = toGlobalId(
      'HomePageArtistModule',
      JSON.stringify({ key: 'TRENDING' })
    );

    it('generates a Global ID', () => {
      const query = `
        {
          home_page {
            artist_module(key: TRENDING) {
              __id
            }
          }
        }
      `;

      return runQuery(query).then(data => {
        expect(data).toEqual({
          home_page: {
            artist_module: {
              __id: globalId,
            },
          },
        });
      });
    });

    it('resolves a node', () => {
      const query = `
        {
          node(__id: "${globalId}") {
            __typename
            ... on HomePageArtistModule {
              key
            }
          }
        }
      `;

      return runQuery(query).then(data => {
        expect(data).toEqual({
          node: {
            __typename: 'HomePageArtistModule',
            key: 'TRENDING',
          },
        });
      });
    });
  });
});
