import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../schema';
import jwt from 'jwt-simple';
import { omit } from 'lodash';

const { HMAC_SECRET } = process.env;

describe('CausalityJWT', () => {
  const CausalityJWT = schema.__get__('CausalityJWT');

  let gravity;

  beforeEach(() => {
    gravity = sinon.stub();
    gravity.with = sinon.stub().returns(gravity);
    gravity
      .onCall(0)
      .returns(Promise.resolve({
        id: 'craig',
        paddle_number: '123',
        type: 'User',
      }))
      .onCall(1)
      .returns(Promise.resolve([{ sale: { _id: 'foo' } }]));
    CausalityJWT.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    CausalityJWT.__ResetDependency__('gravity');
  });

  it('encodes a JWT for Causality', () => {
    const query = `{
      causality_jwt(role: BIDDER, sale_id: "foo")
    }`;
    return graphql(schema, query, { accessToken: 'foo' })
      .then((data) => {
        omit(jwt.decode(data.data.causality_jwt, HMAC_SECRET), 'iat')
          .should.eql({
            aud: 'auctions',
            role: 'bidder',
            userId: 'craig',
            saleId: 'foo',
            bidderId: '123',
          });
      });
  });

  it('denies a bidder not registered to the sale', () => {
    const query = `{
      causality_jwt(role: BIDDER, sale_id: "bar")
    }`;
    return graphql(schema, query, { accessToken: 'foo' })
      .then((data) => {
        data.errors[0].message.should.containEql('Not registered');
      });
  });

  it('denies a non-admin operator', () => {
    const query = `{
      causality_jwt(role: OPERATOR, sale_id: "foo")
    }`;
    return graphql(schema, query, { accessToken: 'foo' })
      .then((data) => {
        data.errors[0].message.should.containEql('Unauthorized');
      });
  });
});
