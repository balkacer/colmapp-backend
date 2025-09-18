import * as Joi from 'joi';

export const validationSchema = Joi.object({
  MONGO_URI: Joi.string().uri().required(),
  MONGO_DBNAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).optional(),
  RABBITMQ_URI: Joi.string().uri().required(),
  RABBITMQ_AUTH_QUEUE: Joi.string().required(),
  SERVICE_NAME: Joi.string().required(),
  PORT: Joi.number().default(3000),
});