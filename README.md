# koa2-joi-validate

[![npm version](https://badge.fury.io/js/koa2-joi-validate.svg)](https://badge.fury.io/js/koa2-joi-validate)

A middleware for validating Koa2 inputs using Joi schemas. Fills some of the
voids I found that other Joi middleware miss such as:

* Allow the developers to easily specify the order in which request inputs are
validated.
* Replaces the incoming `contenxt.request.body` and others with converted Joi values. The
same applies for headers, query, and params, but...
* Retains the original `contenxt.request.body` inside a new property named `contenxt.request.originalBody`
. The same applies for headers, query, and params using the `original` prefix,
e.g `contenxt.request.originalQuery` will contain the `contenxt.request.query` as it looked *before*
validation.
* Passes sensible default options to Joi for headers, params, query, and body.
These are detailed below.
* Uses `peerDependencies` to get a Joi instance of your choosing instead of
using a fixed version.


## Install

You need to install `joi` along with this module for it to work since it relies
on it as a peer dependency. Currently this module has only been tested with joi
version 10.0 and higher.

```
# we install our middleware AND joi since it's required by our middleware
npm i koa2-joi-validate joi --save

# OR

yarn add koa2-joi-validate joi
```

## Usage

```js
const Joi = require('joi');
const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');

const validator = require('koa2-joi-validate')();
const querySchema = Joi.object({
  type: Joi.string().required().valid('food', 'drinks', 'entertainment')
})

const router = new Router();

router.post('/test/:type',
  validator.query(querySchema),
  (ctx, next) => {
    console.log(`original query ${JSON.stringify(ctx.request.originalQuery)} vs. 
                     the sanatised query ${JSON.stringify(ctx.request.query)}`);
  }
);

app.use(router.routes());
```


## Behaviours

### Joi Versioning
This module uses `peerDependencies` for the Joi version being used. This means
whatever Joi version is in the `dependencies` of your `package.json` will be
used by this module.

### Validation Ordering
If you'd like to validate different request inputs in differing orders it's
simple, just define the the middleware in the order desired.

Here's an example where we do headers, body, and finally the query:

```js
// verify headers, then body, then query
router.get(
  '/tickets',
  validator.headers(headerSchema),
  validator.body(bodySchema),
  validator.query(querySchema),
  validator.params(paramsSchema),
  routeHandler
);
```

### Error Handling
When validation fails, this module will default to returning a HTTP 400 with
the Joi validation error as a `text/plain` response type.

A `passError` option is supported to override this behaviour, and force the
middleware to pass the error to the koa2 error handler you've defined.

### Joi Options
It is possible to pass specific Joi options to each validator like so:

```js
router.get(
  '/tickets',
  validator.headers(
    headerSchema,
    {
      joi: {convert: true, allowUnknown: true}
    }
  ),
  validator.body(
    bodySchema,
    {
      joi: {convert: true, allowUnknown: false}
    }
  ),
  routeHandler
);
```

The following sensible defaults are applied if you pass none:

#### Query
* convert: true
* allowUnknown: false
* abortEarly: false

#### Body
* convert: true
* allowUnknown: false
* abortEarly: false

#### Headers
* convert: true
* allowUnknown: true
* stripUnknown: false
* abortEarly: false

#### Route Params
* convert: true
* allowUnknown: false
* abortEarly: false

## Custom Koa2 Error handler

If you don't like the default error format returned by this module you can
override it like so:

```js
const validator = require('koa2-joi-validate')({
  passError: true // NOTE: this tells the module to pass the error along for you
});

const Koa = require('koa');
const app = new Koa();

const Router = require('koa-router');
const router = new Router();

// Before your routes add a standard Koa2 error handler. This will be passed the Joi
// error, plus an extra "type" field so we can tell what type of validation failed
app.use(async (ctx, next) => next().catch((err) => {
    if (err.message && err.message.isJoi) {
        ctx.status = 400;
        ctx.body = {
            type: err.message.type,
            message: err.message.details.toString()
        }
    } else {
      ctx.status = 500;
      ctx.body = 'Internal Server Error';
    }
}));

router.get('/orders', 
    validator.query(require('./query-schema')), 
    (ctx, next) => {
    
      #YOUR MIDDLEWARE
      
    }
);

app.use(router.routes());
```


## API

### module(config)

A factory function an instance of the module for use. Can pass the following
options:

* passError - Set this to true if you'd like validation errors to get passed
to the Koa2 error handler so you can handle them manually vs. the default behaviour that returns a 400.
* statusCode - The status code to use when validation fails and _passError_
is false. Default is 400.

### Instance Functions

Each instance function can be passed an options Object with the following:

* joi - Custom options to pass to `Joi.validate`.
* passError - Same as above.
* statusCode - Same as above.

#### instance.query(schema, [options])
Create a middleware instance that will validate the query for an incoming
request. Can be passed `options` that override the options passed when the
instance was created.

#### instance.body(schema, [options])
Create a middleware instance that will validate the body for an incoming
request. Can be passed `options` that override the options passed when the
instance was created.

#### instance.headers(schema, [options])
Create a middleware instance that will validate the headers for an incoming
request. Can be passed `options` that override the options passed when the
instance was created.

#### instance.params(schema, [options])
Create a middleware instance that will validate the params for an incoming
request. Can be passed `options` that override the options passed when the
instance was created.

#### instance.response(schema, [options])
Create a middleware instance that will validate the outgoing response.
Can be passed `options` that override the options passed when the instance was
created.

The `instance.params` middleware is a little different to the others. It _must_
be attached directly to the route it is related to. Here's a sample:

```js
const schema = Joi.object({
  id: Joi.number().integer().required()
});
```
