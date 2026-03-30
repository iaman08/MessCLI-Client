'use strict';

const chalk = require('chalk');
const ora = require('ora');
const api = require('../lib/api');

async function whoami() {
  const spinner = ora('Fetching profile...').start();

  try {
    const { data } = await api.get('/auth/me');
    const user = data.data;

    spinner.stop();

    console.log('\n' + chalk.cyan('━'.repeat(35)));
    console.log(chalk.bold.cyan('  👤 Profile'));
    console.log(chalk.cyan('━'.repeat(35)));
    console.log(`  Name: ${chalk.bold(user.username)}`);
    console.log(`  Role: ${chalk.bold(user.role === 'admin' ? chalk.magenta('admin') : 'user')}`);
    console.log(`  ID:   ${chalk.dim(user._id)}`);
    console.log(chalk.cyan('━'.repeat(35)) + '\n');
  } catch (err) {
    spinner.fail('Failed to fetch profile');
    const msg = err.response?.data?.error || err.message;
    console.error(chalk.red(`\n✖ ${msg}\n`));
  }
}

module.exports = whoami;
