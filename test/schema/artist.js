import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../schema';

describe('Artist type', () => {
  let Artist = schema.__get__('Artist');

  beforeEach(() => {
    Artist.__Rewire__('gravity', sinon.stub().returns(
      Promise.resolve({
        id: 'foo-bar',
        name: 'Foo Bar'
      })
    ));
  });

  afterEach(() => {
    Artist.__ResetDependency__('gravity');
  });

  it('fetches an artist by ID', () => {
    return graphql(schema, '{ artist(id: "foo-bar") { id, name } }')
      .then(({ data }) => {
        Artist.__get__('gravity').args[0][0].should.equal('artist/foo-bar');
        data.artist.id.should.equal('foo-bar');
        data.artist.name.should.equal('Foo Bar');
      });
  });
});
