'use strict';

const chalk = require('chalk');
const ora = require('ora');
const open = require('open');
const api = require('../lib/api');
const config = require('../lib/config');

async function login() {
  // Check if already logged in
  const existingToken = config.getToken();
  if (existingToken) {
    const username = config.getUsername();
    console.log(
      chalk.yellow(`\n⚠  Already logged in as ${chalk.bold(username || 'unknown')}.`) +
        chalk.dim('\n   Run `mess logout` first to switch accounts.\n')
    );
    return;
  }

  const spinner = ora('Initializing login...').start();

  try {
    // Step 1: Get auth code from backend
    const { data } = await api.post('/auth/init');
    const { code, botLink } = data.data;

    spinner.stop();

    console.log('\n' + chalk.cyan('━'.repeat(45)));
    console.log(chalk.bold.cyan('  🔐 MessCLI Login'));
    console.log(chalk.cyan('━'.repeat(45)));
    console.log(
      `\n  ${chalk.dim('1.')} Open Telegram and click the link below`
    );
    console.log(
      `  ${chalk.dim('2.')} Send the code to the bot\n`
    );
    console.log(`  📎 ${chalk.underline.blue(botLink)}`);
    console.log(`  🔑 Code: ${chalk.bold.green(code)}\n`);
    console.log(chalk.cyan('━'.repeat(45)));

    // Try to open the link in browser
    try {
      await open(botLink);
      console.log(chalk.dim('  (Link opened in browser)\n'));
    } catch {
      console.log(chalk.dim('  (Copy the link above and open in browser)\n'));
    }

    // Step 2: Poll for token
    const pollSpinner = ora('Waiting for Telegram verification...').start();
    const maxAttempts = 150; // 5 minutes at 2s intervals (extra time for approval)

    let pendingApprovalShown = false;

    for (let i = 0; i < maxAttempts; i++) {
      await sleep(2000);

      try {
        const pollRes = await api.get(`/auth/poll/${code}`);
        const pollData = pollRes.data;

        if (pollData.success && pollData.data.token) {
          // Token received — login complete
          const { token, username } = pollData.data;

          config.saveToken(token, username);

          pollSpinner.succeed(
            chalk.green(`Logged in as ${chalk.bold(username)}`)
          );
          console.log(
            chalk.dim(`\n  Token saved to ~/.messcli`)
          );
          console.log(
            chalk.dim(`  Run ${chalk.reset('mess menu')} to see available items\n`)
          );
          return;
        }

        if (pollData.success && pollData.data.status === 'pending_approval') {
          if (!pendingApprovalShown) {
            pollSpinner.text = chalk.yellow(
              'Account linked! Waiting for admin approval...'
            );
            pendingApprovalShown = true;
          }
          // Keep polling — admin hasn't approved yet
          continue;
        }
      } catch (err) {
        if (err.response?.status === 403) {
          // Login rejected
          pollSpinner.fail(chalk.red('Login request rejected by admin.'));
          return;
        }
        // 404 = still pending, keep polling
      }
    }

    pollSpinner.fail('Login timed out. Please try again.');
  } catch (err) {
    spinner.fail('Login failed');
    const msg = err.response?.data?.error || err.message;
    console.error(chalk.red(`\n✖ ${msg}\n`));
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = login;
