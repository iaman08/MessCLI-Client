'use strict';

const axios = require('axios');
const chalk = require('chalk');
const config = require('./config');

const baseURL = process.env.MESS_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach Bearer token ──
api.interceptors.request.use((req) => {
  const token = config.getToken();
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ── Response interceptor: handle errors ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        console.error(
          chalk.red('\n✖ Authentication failed. Please run ') +
            chalk.yellow('mess login') +
            chalk.red(' first.\n')
        );
        process.exit(1);
      }

      if (status === 403) {
        console.error(chalk.red('\n✖ Access denied. Insufficient permissions.\n'));
        process.exit(1);
      }

      if (status === 429) {
        const msg = data?.error || 'Too many requests';
        console.error(chalk.red(`\n✖ Rate limited: ${msg}\n`));
        process.exit(1);
      }

      // Pass through other errors
      return Promise.reject(error);
    }

    if (error.code === 'ECONNREFUSED') {
      console.error(
        chalk.red(`\n✖ Cannot connect to server at ${baseURL}`) +
          chalk.dim('\n  Is the backend running?\n')
      );
      process.exit(1);
    }

    return Promise.reject(error);
  }
);

module.exports = api;
