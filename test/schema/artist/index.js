import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../../schema';

describe('Artist type', () => {
  const Artist = schema.__get__('Artist');

  beforeEach(() => {
    Artist.__Rewire__('gravity', sinon.stub().returns(
      Promise.resolve({
        id: 'foo-bar',
        name: 'Foo Bar',
      })
    ));

    const total = sinon.stub();
    total
      .onCall(0)
      .returns(Promise.resolve(42));
    Artist.__Rewire__('total', total);

    const bio = sinon.stub();
    bio
      .onCall(0)
      .returns(Promise.resolve(null));
    Artist.__Rewire__('bio', bio);

    const blurb = sinon.stub();
    blurb
      .onCall(0)
      .returns(Promise.resolve(null));
    Artist.__Rewire__('blurb', blurb);
  });

  afterEach(() => {
    Artist.__ResetDependency__('gravity');
    Artist.__ResetDependency__('total');
    Artist.__ResetDependency__('bio');
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
});
