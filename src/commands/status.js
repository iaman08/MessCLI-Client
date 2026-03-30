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

async function status(orderId) {
  if (!orderId) {
    console.error(chalk.red('\n✖ Please provide an order ID.\n'));
    console.log(chalk.dim('  Usage: mess status 1042\n'));
    return;
  }

  const spinner = ora(`Fetching order #${orderId}...`).start();

  try {
    const { data } = await api.get(`/orders/${orderId}`);
    const order = data.data;

    spinner.stop();

    const colorFn = STATUS_COLORS[order.status] || chalk.white;

    console.log('\n' + chalk.cyan('━'.repeat(45)));
    console.log(chalk.bold.cyan(`  📦 Order #${order.orderId}`));
    console.log(chalk.cyan('━'.repeat(45)));
    console.log(`  Status: ${colorFn(order.status.toUpperCase())}`);
    console.log(`  Total:  ${chalk.bold.green(`₹${order.totalAmount}`)}`);
    console.log(`  Date:   ${chalk.dim(new Date(order.createdAt).toLocaleString())}`);

    console.log(`\n  ${chalk.bold('Items:')}`);
    order.items.forEach((item) => {
      console.log(
        `    • ${item.name} × ${item.qty}  ${chalk.green(`₹${item.price * item.qty}`)}`
      );
    });

    // Show OTP prominently if ready
    if (order.status === 'ready' && !order.otpUsed) {
      console.log('\n' + chalk.green.bold('  ┌─────────────────────────────┐'));
      console.log(chalk.green.bold(`  │  🔑 OTP: ${order.otp}              │`));
      console.log(chalk.green.bold('  │  Show this at the counter   │'));
      console.log(chalk.green.bold('  └─────────────────────────────┘'));
    }

    // Show cancel_requested notice
    if (order.status === 'cancel_requested') {
      console.log('\n' + chalk.magenta('  ⏳ Cancellation requested — waiting for vendor approval'));
    }

    console.log(chalk.cyan('━'.repeat(45)) + '\n');
  } catch (err) {
    spinner.fail('Failed to fetch order');
    const msg = err.response?.data?.error || err.message;
    console.error(chalk.red(`\n✖ ${msg}\n`));
  }
}

module.exports = status;
