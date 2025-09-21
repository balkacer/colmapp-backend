import * as Joi from 'joi';

export const validationSchema = Joi.object({
  MONGO_URI: Joi.string().uri().required(),
  MONGO_DBNAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).optional(),
  RABBITMQ_URI: Joi.string().uri().required(),
  RABBITMQ_AUTH_QUEUE: Joi.string().optional(),
  RABBITMQ_PRODUCTS_QUEUE: Joi.string().optional(),
  RABBITMQ_FILES_QUEUE: Joi.string().optional(),
  RABBITMQ_PROVIDERS_QUEUE: Joi.string().optional(),
  RABBITMQ_ORDERS_QUEUE: Joi.string().optional(),
  RABBITMQ_PAYMENT_QUEUE: Joi.string().optional(),
  RABBITMQ_NOTIFICATIONS_QUEUE: Joi.string().optional(),
  RABBITMQ_CUSTOMERS_QUEUE: Joi.string().optional(),
  SERVICE_NAME: Joi.string().required(),
  PORT: Joi.number().default(3000),
});