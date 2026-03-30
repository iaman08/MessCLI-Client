'use strict';

const { randomUUID } = require('node:crypto');
const chalk = require('chalk');
const ora = require('ora');
const api = require('../lib/api');

async function order(itemsArgs) {
  if (!itemsArgs || itemsArgs.length === 0) {
    console.error(chalk.red('\n✖ Please provide at least one item.\n'));
    console.log(chalk.dim('  Usage: mess order "Coffee"'));
    console.log(chalk.dim('  Usage: mess order "Coffee:2" "Maggi:1"\n'));
    return;
  }

  // Parse items into { name, qty }
  const parsedItems = [];
  for (const arg of itemsArgs) {
    const parts = arg.split(':');
    const name = parts[0].trim();
    const qty = parts.length > 1 ? parseInt(parts[1], 10) : 1;

    if (!name) continue;
    if (isNaN(qty) || qty < 1 || qty > 20) {
      console.error(chalk.red(`\n✖ Invalid quantity for "${name}". Must be between 1 and 20.\n`));
      return;
    }
    parsedItems.push({ name, qty });
  }

  if (parsedItems.length === 0) return;

  // Step 1: Search for all items
  const searchSpinner = ora('Searching for items...').start();
  const cartItems = [];
  let grandTotal = 0;

  try {
    for (const reqItem of parsedItems) {
      const searchRes = await api.get('/products/search', {
        params: { q: reqItem.name },
      });
      const products = searchRes.data.data;

      if (!products || products.length === 0) {
        searchSpinner.fail(`Item not found: "${reqItem.name}"`);
        console.log(chalk.dim('  Run `mess menu` to check exact names.\n'));
        return;
      }

      // Use the first match
      const product = products[0];
      const lineTotal = product.price * reqItem.qty;
      grandTotal += lineTotal;

      cartItems.push({
        product,
        qty: reqItem.qty,
        lineTotal
      });
    }

    searchSpinner.stop();

    console.log('\n' + chalk.cyan('━'.repeat(55)));
    console.log(chalk.bold.cyan('  🛒 Order Confirmation'));
    console.log(chalk.cyan('━'.repeat(55)));
    
    // Build cart items array for the API
    const apiPayloadItems = [];

    cartItems.forEach((cartItem) => {
      const p = cartItem.product;
      const q = cartItem.qty;
      apiPayloadItems.push({ productId: p._id, qty: q });

      console.log(`  • ${chalk.bold(p.name.padEnd(25))} (x${q})  ${chalk.green(`₹${cartItem.lineTotal}`)}`);
    });

    console.log(chalk.cyan('━'.repeat(55)));
    console.log(`  ${chalk.bold('Grand Total:')}               ${chalk.bold.green(`₹${grandTotal}`)}`);
    console.log(chalk.cyan('━'.repeat(55)) + '\n');

    // Step 2: Place the multi-item order with idempotency key
    const orderSpinner = ora('Placing order...').start();

    // Generate idempotency key to prevent duplicate orders on retry
    const idempotencyKey = randomUUID();

    const orderRes = await api.post('/orders', {
      items: apiPayloadItems,
      idempotencyKey,
    });

    const orderData = orderRes.data.data;

    if (orderData._deduplicated) {
      orderSpinner.warn(chalk.yellow('Duplicate order detected — returning existing order'));
    } else {
      orderSpinner.succeed(chalk.green('Order placed!'));
    }

    console.log('\n' + chalk.green('━'.repeat(45)));
    console.log(chalk.bold.green('  ✅ Order Confirmed'));
    console.log(chalk.green('━'.repeat(45)));
    console.log(`  Order ID: ${chalk.bold.white(`#${orderData.orderId}`)}`);
    console.log(`  OTP:      ${chalk.bold.yellow(orderData.otp)}`);
    console.log(`  Status:   ${chalk.yellow('pending')}`);
    console.log(`  Total:    ${chalk.bold.green(`₹${orderData.totalAmount}`)}`);
    console.log(chalk.green('━'.repeat(45)));
    console.log(
      chalk.dim(`\n  💡 Run ${chalk.reset(`mess watch ${orderData.orderId}`)} to track your order`)
    );
    console.log(
      chalk.dim(`  💡 Show OTP ${chalk.reset(orderData.otp)} at the counter when ready\n`)
    );
  } catch (err) {
    if (searchSpinner.isSpinning) searchSpinner.stop();
    const msg = err.response?.data?.error || err.message;
    console.error(chalk.red(`\n✖ ${typeof msg === 'string' ? msg : JSON.stringify(msg)}\n`));
  }
}

module.exports = order;
