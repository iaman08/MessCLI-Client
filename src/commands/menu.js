'use strict';

const chalk = require('chalk');
const ora = require('ora');
const api = require('../lib/api');

async function menu() {
  const spinner = ora('Loading menu...').start();

  try {
    const { data } = await api.get('/products');
    const products = data.data;

    spinner.stop();

    if (!products || products.length === 0) {
      console.log(chalk.yellow('\n📋 No items available right now.\n'));
      return;
    }

    console.log('\n' + chalk.cyan('━'.repeat(45)));
    console.log(chalk.bold.cyan('  📋 Menu'));
    console.log(chalk.cyan('━'.repeat(45)));

    // Header
    console.log(
      `  ${chalk.dim('#')}  ${chalk.bold('Item'.padEnd(30))} ${chalk.bold('Price')}`
    );
    console.log('  ' + chalk.dim('─'.repeat(41)));

    products.forEach((p, i) => {
      const num = chalk.dim(String(i + 1).padStart(2) + '.');
      const name = p.name.padEnd(30);
      const price = chalk.green(`₹${p.price}`);
      console.log(`  ${num} ${name} ${price}`);
    });

    console.log(chalk.cyan('━'.repeat(45)));
    console.log(
      chalk.dim(`  ${products.length} items available`)
    );
    console.log(
      chalk.dim(`  Run ${chalk.reset('mess order "<item>"')} to order\n`)
    );
  } catch (err) {
    spinner.fail('Failed to load menu');
    const msg = err.response?.data?.error || err.message;
    console.error(chalk.red(`\n✖ ${msg}\n`));
  }
}

module.exports = menu;
