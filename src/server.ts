import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './docs/openapi';
import { errorHandler } from './middleware/errorHandler';
import router from './routes';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use(router);
app.use(errorHandler);

const PORT = process.env.NODE_ENV === 'test' ? 0 : process.env.PORT || 3000;

export async function startServer(): Promise<ReturnType<typeof app.listen>> {
  const server = app.listen(PORT, () => {
    if (process.env.NODE_ENV !== 'test') {
      const address = server.address();
      const port = typeof address === 'string' ? address : address?.port;
      console.log(`Server is running on PORT ${port}`);
    }
  });
  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
