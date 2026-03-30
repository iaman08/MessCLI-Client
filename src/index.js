#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const chalk = require('chalk');

const program = new Command();

program
  .name('mess')
  .description(chalk.cyan('🍽️  MessCLI — Hostel Mess Ordering System'))
  .version('1.0.0');

// ── Auth commands ──
program
  .command('login')
  .description('Link your Telegram account to MessCLI')
  .action(async () => {
    const login = require('./commands/login');
    await login();
  });

program
  .command('logout')
  .description('Log out and invalidate your session')
  .action(async () => {
    const logout = require('./commands/logout');
    await logout();
  });

program
  .command('whoami')
  .description('Show your profile info')
  .action(async () => {
    const whoami = require('./commands/whoami');
    await whoami();
  });

// ── Menu commands ──
program
  .command('menu')
  .description('View available menu items')
  .action(async () => {
    const menu = require('./commands/menu');
    await menu();
  });

program
  .command('search <query>')
  .description('Search menu items by name')
  .action(async (query) => {
    const search = require('./commands/search');
    await search(query);
  });

// ── Order commands ──
program
  .command('order <items...>')
  .description('Place an order for menu items (e.g. "Coffee:2" "Maggi:1")')
  .action(async (items) => {
    const order = require('./commands/order');
    await order(items);
  });

program
  .command('orders')
  .description('List your recent orders')
  .action(async () => {
    const orders = require('./commands/orders');
    await orders();
  });

program
  .command('status <orderId>')
  .description('View details of a specific order')
  .action(async (orderId) => {
    const status = require('./commands/status');
    await status(orderId);
  });

program
  .command('watch <orderId>')
  .description('Watch an order for status updates (live)')
  .action(async (orderId) => {
    const watch = require('./commands/watch');
    await watch(orderId);
  });

program
  .command('cancel <orderId>')
  .description('Cancel a pending order')
  .action(async (orderId) => {
    const cancel = require('./commands/cancel');
    await cancel(orderId);
  });

// ── Parse and execute ──
program.parse(process.argv);

// Show help if no command given
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
