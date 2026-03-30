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

async function watch(orderId) {
  if (!orderId) {
    console.error(chalk.red('\n✖ Please provide an order ID.\n'));
    console.log(chalk.dim('  Usage: mess watch 1042\n'));
    return;
  }

  console.log(
    chalk.cyan(`\n👀 Watching order #${orderId}...`) +
      chalk.dim(' (Ctrl+C to stop)\n')
  );

  let lastStatus = '';
  let attempts = 0;
  const maxAttempts = 360; // 30 minutes at 5s intervals

  const spinner = ora({
    text: 'Checking status...',
    color: 'cyan',
  }).start();

  while (attempts < maxAttempts) {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      const order = data.data;
      const colorFn = STATUS_COLORS[order.status] || chalk.white;

      if (order.status !== lastStatus) {
        lastStatus = order.status;
        spinner.text = `Order #${orderId}: ${colorFn(order.status.toUpperCase())}`;

        // Exit conditions
        if (order.status === 'ready') {
          spinner.succeed(
            chalk.green.bold(`Order #${orderId} is READY!`)
          );
          console.log('\n' + chalk.green.bold('  ┌─────────────────────────────────┐'));
          console.log(chalk.green.bold(`  │  🔑 Your OTP: ${order.otp}                │`));
          console.log(chalk.green.bold('  │  Go pick up your order now!     │'));
          console.log(chalk.green.bold('  └─────────────────────────────────┘\n'));
          return;
        }

        if (order.status === 'completed') {
          spinner.succeed(chalk.dim(`Order #${orderId} has been completed.`));
          return;
        }

        if (order.status === 'cancelled') {
          spinner.fail(chalk.red(`Order #${orderId} was cancelled.`));
          return;
        }

        if (order.status === 'cancel_requested') {
          spinner.text = `Order #${orderId}: ${chalk.magenta('CANCEL REQUESTED')} — waiting for vendor...`;
        }
      }
    } catch (err) {
      // Don't crash on transient errors
      if (err.response?.status === 404) {
        spinner.fail(`Order #${orderId} not found.`);
        return;
      }
    }

    await sleep(5000);
    attempts++;
  }

  spinner.warn('Watch timed out after 30 minutes.');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = watch;
