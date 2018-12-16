'use strict'

const Joi = require('joi')
const sinon = require('sinon')
const supertest = require('supertest')
const expect = require('chai').expect

describe('Koa2 JOI TEST', function() {
  const Koa = require('koa');
  const app = new Koa();

  const bodyParser = require('koa-bodyparser');
  app.use(bodyParser());

  const Router = require('koa-router');
  const router = new Router();

  const server = app.listen(3000);
  const request = supertest(server);
  const validator = require('./index')();

  const joiSchema = Joi.object({
    key: Joi.number()
      .min(1)
      .max(10)
      .required()
  })

  router.get('/headers-check', validator.headers(joiSchema), (ctx) => {
    expect(ctx.request.headers).to.exist
    expect(ctx.request.originalHeaders).to.exist

    expect(ctx.request.headers.key).to.be.a('number')
    expect(ctx.request.originalHeaders.key).to.be.a('string')

    ctx.body = 'ok';
  })

  router.get('/query-check', validator.query(joiSchema), (ctx) => {
    expect(ctx.request.query).to.exist
    expect(ctx.request.originalQuery).to.exist

    expect(ctx.request.query.key).to.be.a('string')
    expect(ctx.request.originalQuery.key).to.be.a('string')

    ctx.body = 'ok';
  })

  router.post('/body-check', validator.body(joiSchema), (ctx) => {
      expect(ctx.request.body).to.exist
      expect(ctx.request.originalBody).to.exist

      expect(ctx.request.body.key).to.be.a('number')
      expect(ctx.request.originalBody.key).to.be.a('string')

      ctx.body = 'ok';
  })

  router.get('/params-check/:key', validator.params(joiSchema), (ctx) => {
    expect(ctx.params).to.exist
    expect(ctx.originalParams).to.exist

    expect(ctx.params.key).to.be.a('number')
    expect(ctx.originalParams.key).to.be.a('string')

    ctx.body = 'ok'
  })


  app.use(router.routes());

  describe('#headers', function() {
    it('should return a 200 since our request is valid', function(done) {
      request
        .get('/headers-check')
        .expect(200)
        .set('key', '10')
        .end(done)
    })

    it('should return a 400 since our request is invalid', function(done) {
      request
        .get('/headers-check')
        .expect(400)
        .set('key', '150')
        .end(function(err, res) {
          expect(res.text).to.contain('"key" must be less than or equal to 10')
          done()
        })
    })
  })

  describe('#query', function() {
    it('should return a 200 since our querystring is valid', function(done) {
      request
        .get('/query-check?key=5')
        .expect(200)
        .end(done)
    })

    it('should return a 400 since our querystring is invalid', function(done) {
      request
        .get('/query-check')
        .expect(400)
        .end(function(err, res) {
          expect(res.text).to.contain('"key" is required')
          done()
        })
    })
  })

  describe('#body', function() {
    it('should return a 200 since our body is valid', function(done) {
      request
        .post('/body-check')
        .send({
          key: '1'
        })
        .expect(200)
        .end(done)
    })

    it('should return a 400 since our body is invalid', function(done) {
      request
        .post('/body-check')
        .expect(400)
        .end(function(err, res) {
          expect(res.text).to.contain('"key" is required')
          done()
        })
    })
  })

  describe('#params', function() {
    it('should return a 200 since our request param is valid', function(done) {
      request
        .get('/params-check/3')
        .expect(200)
        .end(done)
    })

    it('should return a 400 since our param is invalid', function(done) {
      request
        .get('/params-check/not-a-number')
        .expect(400)
        .end(function(err, res) {
          expect(res.text).to.contain('"key" must be a number')
          done()
        })
    })
  })

  server.close()
});

// test('Start server', t => {
//   server = app.listen(3000);
//   request = supertest(server);
//   t.end();
// })
//
// test('Koa test', t => {
//   request
//     .get('/')
//     .expect(200)
//     .end((err, res) => {
//       if (err) throw err;
//
//       t.equals(res.text, 'Hello World');
//       t.end();
//     });
// });
//
// test('Shutdown server', t => {
//   server.close();
//   t.end();
// });