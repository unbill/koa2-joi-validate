'use strict';

// These represent the incoming data containers that we might need to validate
const containers = {
  query: {
    storageProperty: 'originalQuery',
    joi: {
      convert: true,
      allowUnknown: false,
      abortEarly: false
    }
  },
  // For use with koa-bodyparser
  body: {
    storageProperty: 'originalBody',
    joi: {
      convert: true,
      allowUnknown: false,
      abortEarly: false
    }
  },
  headers: {
    storageProperty: 'originalHeaders',
    joi: {
      convert: true,
      allowUnknown: true,
      stripUnknown: false,
      abortEarly: false
    }
  },
  // URL params e.g "/users/:userId"
  params: {
    storageProperty: 'originalParams',
    joi: {
      convert: true,
      allowUnknown: false,
      abortEarly: false
    }
  }
};

class JoiError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

function buildErrorString(err, container) {
  let ret = `Error validating ${container}.`;
  let details = err.error.details;

  for (let i = 0; i < details.length; i++) {
    ret += ` ${details[i].message}.`
  }

  return ret
}

module.exports = function generateJoiMiddlewareInstance(cfg) {
  cfg = cfg || {}; // default to an empty config

  const Joi = cfg.joi || require('@hapi/joi');

  const instance = { };

  Object.keys(containers).forEach(type => {
    // e.g the "body" or "query" from above
    const container = containers[type];

    instance[type] = function(schema, opts) {
      opts = opts || {}; // like config, default to empty object

      return async function Koa2JoiValidator(ctx, next) {
        const ret = Joi.validate( (type === 'params') ? ctx[type] : ctx.request[type], schema, opts.joi || container.joi);

        if (!ret.error) {

          if ( type === 'params' ) {
            ctx[container.storageProperty] = ctx[type];
            ctx[type] = ret.value;
          } else {
            ctx.request[container.storageProperty] = ctx.request[type];
            ctx.request[type] = ret.value;
          }

          await next()
        } else if (opts.passError || cfg.passError) {
          ret.error.type = type;
          throw new JoiError(ret.error);
        } else {
          ctx.status = opts.statusCode || cfg.statusCode || 400;
          ctx.body = buildErrorString(ret, type);
        }
      }
    }
  });

  return instance;

};
