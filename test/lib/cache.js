import fakeredis from 'fakeredis';
import cache from '../../lib/cache';

describe('Cache', () => {
  let client = fakeredis.createClient();

  before(() => {
    cache.__Rewire__('client', client);
  });

  after(() => {
    cache.__ResetDependency__('client');
  });

  afterEach((done) => {
    client.flushdb(err => done());
  });

  describe('#get', () => {
    beforeEach(() => cache.set('get_foo', { bar: 'baz'}));

    it('parses the data and resolves the promise', (done) => {
      let promise = cache.get('get_foo');

      promise.should.be.instanceOf(Promise);

      promise
        .then(data => {
          data.bar.should.equal('baz');
          done();
        });
    });
  });

  describe('#set', () => {
    describe('with a plain Object', () => {
      it('sets the cache and includes a timestamp', (done) => {
        cache.set('set_foo', { bar: 'baz' });

        client.get('set_foo', (err, data) => {
          let parsed = JSON.parse(data);

          parsed.bar.should.equal('baz');
          parsed.cached.should.be.instanceOf(Number)

          done();
        });
      });
    });

    describe('with an Array', () => {
      it('sets the cache and includes a timestamp', (done) => {
        cache.set('set_bar', [{ baz: 'qux' }]);

        client.get('set_bar', (err, data) => {
          let parsed = JSON.parse(data);

          parsed.should.have.lengthOf(1);
          parsed[0].baz.should.equal('qux');
          parsed[0].cached.should.be.instanceOf(Number)

          done();
        });
      });
    });
  });
});
