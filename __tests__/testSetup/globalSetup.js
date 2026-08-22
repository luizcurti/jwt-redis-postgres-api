const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('./testEnv');

module.exports = async function globalSetup() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  });

  await client.connect();

  const schema = fs.readFileSync(
    path.join(__dirname, '..', '..', 'database.sql'),
    'utf-8'
  );
  await client.query(schema);

  await client.end();
};
