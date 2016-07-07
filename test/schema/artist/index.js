import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../../schema';

describe('Artist type', () => {
  const Artist = schema.__get__('Artist');
  let artist = null;

  beforeEach(() => {
    artist = {
      id: 'foo-bar',
      name: 'Foo Bar',
      bio: null,
      blurb: null,
    };

    Artist.__Rewire__('gravity', sinon.stub().returns(Promise.resolve(artist)));

    Artist.__Rewire__('positron', sinon.stub().returns(
      Promise.resolve({
        count: 22,
      })
    ));

    const total = sinon.stub();
    total
      .onCall(0)
      .returns(Promise.resolve(42));
    Artist.__Rewire__('total', total);
  });

  afterEach(() => {
    Artist.__ResetDependency__('gravity');
    Artist.__ResetDependency__('total');
    Artist.__ResetDependency__('positron');
  });

  it('fetches an artist by ID', () => {
    return graphql(schema, '{ artist(id: "foo-bar") { id, name } }')
      .then(({ data }) => {
        Artist.__get__('gravity').args[0][0].should.equal('artist/foo-bar');
        data.artist.id.should.equal('foo-bar');
        data.artist.name.should.equal('Foo Bar');
      });
  });

  it('returns the total number of partner shows for an artist', () => {
    const query = `
      {
        artist(id: "foo-bar") {
          counts {
            partner_shows
          }
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        data.should.eql({
          artist: {
            counts: {
              partner_shows: 42,
            },
          },
        });
      });
  });

  it('returns the total number of related artists for an artist', () => {
    const query = `
      {
        artist(id: "foo-bar") {
          counts {
            related_artists
          }
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        data.should.eql({
          artist: {
            counts: {
              related_artists: 42,
            },
          },
        });
      });
  });

  it('returns the total number of related articles for an artist', () => {
    const query = `
      {
        artist(id: "foo-bar") {
          counts {
            articles
          }
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        data.should.eql({
          artist: {
            counts: {
              articles: 22,
            },
          },
        });
      });
  });

  it('returns false if artist has no metadata', () => {
    const query = `
      {
        artist(id: "foo-bar") {
          has_metadata
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        data.should.eql({
          artist: {
            has_metadata: false,
          },
        });
      });
  });

  describe('concerning works count', () => {
    it('returns a formatted description including works for sale', () => {
      artist.published_artworks_count = 42;
      artist.forsale_artworks_count = 21;

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_artworks_count
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            artist: {
              formatted_artworks_count: '42 works, 21 for sale',
            },
          });
        });
    });

    it('returns only works if none are for sale', () => {
      artist.published_artworks_count = 42;
      artist.forsale_artworks_count = 0;

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_artworks_count
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            artist: {
              formatted_artworks_count: '42 works',
            },
          });
        });
    });

    it('returns null when there are no works', () => {
      artist.published_artworks_count = 0;
      artist.forsale_artworks_count = 0;

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_artworks_count
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            artist: {
              formatted_artworks_count: null,
            },
          });
        });
    });

    it('returns a singular string if only one work for sale', () => {
      artist.published_artworks_count = 1;
      artist.forsale_artworks_count = 0;

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_artworks_count
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) => {
          data.should.eql({
            artist: {
              formatted_artworks_count: '1 work',
            },
          });
        });
    });
  });
});
