'use strict';

const chalk = require('chalk');
const ora = require('ora');
const api = require('../lib/api');

async function search(query) {
  if (!query || query.trim().length === 0) {
    console.error(chalk.red('\n✖ Please provide a search query.\n'));
    console.log(chalk.dim('  Usage: mess search "coffee"\n'));
    return;
  }

  const spinner = ora(`Searching for "${query}"...`).start();

  try {
    const { data } = await api.get('/products/search', {
      params: { q: query },
    });
    const products = data.data;

    spinner.stop();

    if (!products || products.length === 0) {
      console.log(
        chalk.yellow(`\n🔍 No results for "${query}".\n`) +
          chalk.dim('  Try a different search term.\n')
      );
      return;
    }

    console.log(
      `\n🔍 ${chalk.bold(`${products.length} result${products.length > 1 ? 's' : ''}`)} for "${chalk.cyan(query)}"\n`
    );

    products.forEach((p, i) => {
      const num = chalk.dim(String(i + 1).padStart(2) + '.');
      console.log(
        `  ${num} ${p.name.padEnd(30)} ${chalk.green(`₹${p.price}`)}`
      );
    });

    console.log(
      chalk.dim(`\n  Run ${chalk.reset('mess order "<item>"')} to order\n`)
    );
  } catch (err) {
    spinner.fail('Search failed');
    const msg = err.response?.data?.error || err.message;
    console.error(chalk.red(`\n✖ ${msg}\n`));
  }
}

module.exports = search;
