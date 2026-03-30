'use strict';

const chalk = require('chalk');
const ora = require('ora');
const api = require('../lib/api');
const config = require('../lib/config');

async function logout() {
  const token = config.getToken();
  if (!token) {
    console.log(chalk.yellow('\n⚠  Not logged in.\n'));
    return;
  }

  const spinner = ora('Logging out...').start();

  try {
    await api.delete('/auth/logout');
    config.clear();
    spinner.succeed(chalk.green('Logged out successfully'));
    console.log(chalk.dim('  Token invalidated and local config removed.\n'));
  } catch (err) {
    // Even if the server request fails, clear local token
    config.clear();
    spinner.warn('Logged out locally (server may not have been reached)');
    console.log(chalk.dim('  Local config removed.\n'));
  }
}

module.exports = logout;
