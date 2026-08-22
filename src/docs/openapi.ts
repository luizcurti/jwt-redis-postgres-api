const userPublicSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    username: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
};

const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
  },
};

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Node.js + Redis + PostgreSQL REST API',
    version: '2.0.0',
    description:
      'User registration, JWT authentication, and Redis-backed profile caching.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      UserPublic: userPublicSchema,
      Error: errorSchema,
    },
  },
  paths: {
    '/': {
      get: {
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Server is running',
          },
        },
      },
    },
    '/users': {
      post: {
        summary: 'Create a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'username', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created successfully' },
          '400': {
            description: 'Missing required fields',
            content: { 'application/json': { schema: errorSchema } },
          },
          '409': {
            description: 'Username already taken',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/login': {
      post: {
        summary: 'Authenticate a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful, returns a JWT and the user profile',
          },
          '400': {
            description: 'Missing username or password',
            content: { 'application/json': { schema: errorSchema } },
          },
          '401': {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/users/profile/{id}': {
      get: {
        summary: 'Get the authenticated user own profile from cache',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Must match the id of the authenticated user',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'The cached user profile',
            content: {
              'application/json': { schema: userPublicSchema },
            },
          },
          '401': {
            description: 'Missing or invalid token',
            content: { 'application/json': { schema: errorSchema } },
          },
          '403': {
            description: 'The authenticated user does not own this profile',
            content: { 'application/json': { schema: errorSchema } },
          },
          '404': {
            description: 'Profile not found in cache (session expired)',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
  },
};
