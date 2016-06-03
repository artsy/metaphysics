import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../../schema';

describe('Artist type', () => {
  const Artist = schema.__get__('Artist');
  let gravityResponse = null;

  beforeEach(() => {
    gravityResponse = {
      id: 'foo-bar',
      name: 'Foo Bar',
      biography: null,
      blurb: null,
    };

    Artist.__Rewire__('gravity', sinon.stub().returns(
      Promise.resolve(gravityResponse)
    ));

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

  [
    { fields: { biography: null, blurb: null }, expected: false },
    { fields: { biography: '', blurb: null }, expected: false },
    { fields: { biography: null, blurb: '' }, expected: false },
    { fields: { biography: '', blurb: '' }, expected: false },
    { fields: { biography: '..', blurb: null }, expected: true },
    { fields: { biography: null, blurb: '..' }, expected: true },
    { fields: { biography: '..', blurb: '..' }, expected: true },
  ].forEach(({ fields, expected }) => {
    const desc = JSON.stringify(fields);
    it(`returns that an artist ${expected ? 'has' : 'has no'} metadata with data: ${desc}`, () => {
      Object.assign(gravityResponse, fields);

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
              has_metadata: expected,
            },
          });
        });
    });
  });
});
