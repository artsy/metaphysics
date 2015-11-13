import fakeredis from 'fakeredis';
import cache from '../../lib/cache';

describe('Cache', () => {
  describe('when connection to Redis fails', () => {
    before(() => {
      cache.__Rewire__('client', null);
    });

    after(() => {
      cache.__ResetDependency__('client');
    });

    describe('#get', () => {
      it('falls through with a rejection', () => {
        return cache.get('foobar').should.be.rejected();
      });
    });

    describe('#set', () => {
      it('returns false', () => {
        cache.set('foo', {}).should.be.false();
      })
    });
  });

  describe('when successfully connected to Redis', () => {
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

      it('parses the data and resolves the promise', () => {
        return cache.get('get_foo').then(data => {
          data.bar.should.equal('baz')
        }).should.be.fulfilled();
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
});
