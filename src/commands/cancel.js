'use strict';

const chalk = require('chalk');
const ora = require('ora');
const api = require('../lib/api');

async function cancel(orderId) {
  if (!orderId) {
    console.error(chalk.red('\n✖ Please provide an order ID.\n'));
    console.log(chalk.dim('  Usage: mess cancel 1042\n'));
    return;
  }

  // First check order status
  const statusSpinner = ora(`Checking order #${orderId}...`).start();

  try {
    const { data: statusData } = await api.get(`/orders/${orderId}`);
    const order = statusData.data;

    statusSpinner.stop();

    if (order.status === 'pending') {
      // Pending orders can be cancelled directly
      const spinner = ora(`Cancelling order #${orderId}...`).start();
      const { data } = await api.delete(`/orders/${orderId}/cancel`);
      spinner.succeed(
        chalk.green(`Order #${data.data.orderId} cancelled successfully.`)
      );
      console.log('');
    } else if (['accepted', 'preparing', 'ready'].includes(order.status)) {
      // Non-pending orders need cancel request
      const spinner = ora(`Requesting cancellation for order #${orderId}...`).start();
      const { data } = await api.post(`/orders/${orderId}/cancel-request`);
      spinner.succeed(
        chalk.yellow(`Cancellation requested for order #${data.data.orderId}`)
      );
      console.log(chalk.dim('\n  Your request has been sent to the vendor for approval.'));
      console.log(chalk.dim(`  Run ${chalk.reset(`mess watch ${orderId}`)} to track the result.\n`));
    } else {
      console.log(
        chalk.red(`\n✖ Cannot cancel order with status "${order.status}".\n`)
      );
    }
  } catch (err) {
    if (statusSpinner.isSpinning) statusSpinner.stop();
    const msg = err.response?.data?.error || err.message;
    console.error(chalk.red(`\n✖ ${msg}\n`));
  }
}

module.exports = cancel;
