'use strict';

const chalk = require('chalk');
const ora = require('ora');
const api = require('../lib/api');

const STATUS_COLORS = {
  pending: chalk.yellow,
  accepted: chalk.blue,
  preparing: chalk.blue,
  ready: chalk.green.bold,
  completed: chalk.dim,
  cancelled: chalk.red,
  cancel_requested: chalk.magenta,
};

async function orders() {
  const spinner = ora('Loading orders...').start();

  try {
    const { data } = await api.get('/orders');
    const orderList = data.data;

    spinner.stop();

    if (!orderList || orderList.length === 0) {
      console.log(chalk.yellow('\n📦 No orders yet.\n'));
      console.log(chalk.dim('  Run `mess order "<item>"` to place one.\n'));
      return;
    }

    console.log('\n' + chalk.cyan('━'.repeat(65)));
    console.log(chalk.bold.cyan('  📦 Your Orders'));
    console.log(chalk.cyan('━'.repeat(65)));

    // Header
    console.log(
      `  ${chalk.bold('ID'.padEnd(8))} ${chalk.bold('Items'.padEnd(28))} ${chalk.bold('Total'.padEnd(10))} ${chalk.bold('Status')}`
    );
    console.log('  ' + chalk.dim('─'.repeat(61)));

    orderList.forEach((o) => {
      const id = `#${o.orderId}`.padEnd(8);
      const itemNames = o.items.map((i) => `${i.name}×${i.qty}`).join(', ');
      const items = itemNames.length > 26 ? itemNames.slice(0, 25) + '…' : itemNames;
      const total = `₹${o.totalAmount}`.padEnd(10);
      const colorFn = STATUS_COLORS[o.status] || chalk.white;
      const statusLabel = o.status === 'cancel_requested' ? 'CANCEL_REQ' : o.status;
      const status = colorFn(statusLabel);

      console.log(`  ${chalk.bold(id)} ${items.padEnd(28)} ${chalk.green(total)} ${status}`);
    });

    console.log(chalk.cyan('━'.repeat(65)));
    console.log(
      chalk.dim(`  ${orderList.length} order${orderList.length > 1 ? 's' : ''} shown`)
    );
    console.log(
      chalk.dim(`  Run ${chalk.reset('mess status <id>')} for details\n`)
    );
  } catch (err) {
    spinner.fail('Failed to load orders');
    const msg = err.response?.data?.error || err.message;
    console.error(chalk.red(`\n✖ ${msg}\n`));
  }
}

module.exports = orders;
