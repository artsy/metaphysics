import sinon from 'sinon';
import total from '../../../lib/loaders/total';

describe('total', () => {
  afterEach(() => total.__ResetDependency__('gravity'));

  it('loads the path and passes in the token', () => {
    const gravity = sinon.stub()
      .returns(Promise.resolve({
        headers: {
          'x-total-count': '50',
        },
      }));

    total.__Rewire__('gravity', gravity);

    return total('foo/bar', { extra_option: 1 })
      .then(n => {
        gravity.args[0][0]
          .should.equal('foo/bar?extra_option=1&size=0&total_count=1');

        n.should.equal(50);
      });
  });
});
