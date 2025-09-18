export default () => ({
  mongoUri: process.env.MONGO_URI,
  mongoDbName: process.env.MONGO_DBNAME,
  jwtSecret: process.env.JWT_SECRET,
  rabbitmqUri: process.env.RABBITMQ_URI,
  rabbitmqAuthQueue: process.env.RABBITMQ_AUTH_QUEUE,
  serviceName: process.env.SERVICE_NAME,
  port: parseInt(process.env.PORT ?? "3000", 10),
});