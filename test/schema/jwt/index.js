import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../../schema';
import jwt from 'jwt-simple';

const { HMAC_SECRET } = process.env;

describe('JWT', () => {
  const JWT = schema.__get__('JWT');
  const Me = JWT.__get__('Me');

  let gravity;

  beforeEach(() => {
    gravity = sinon.stub();
    gravity.with = sinon.stub().returns(gravity);
    gravity
      .onCall(0)
      .returns(Promise.resolve({ id: 'craig', email: 'craig@artsy' }));
    Me.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    Me.__ResetDependency__('gravity');
  });

  it('encodes a me query into a JWT', () => {
    const query = `{
      jwt(query: "{ email }")
    }`;
    return graphql(schema, query, { accessToken: 'foo' })
      .then((data) => {
        jwt.decode(data.data.jwt, HMAC_SECRET).email
          .should.equal('craig@artsy');
      });
  });
});
