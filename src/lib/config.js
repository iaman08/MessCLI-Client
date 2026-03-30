'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.messcli');

/**
 * Read the stored auth token from ~/.messcli.
 */
function getToken() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    return data.token || null;
  } catch {
    return null;
  }
}

/**
 * Read the stored username from ~/.messcli.
 */
function getUsername() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    return data.username || null;
  } catch {
    return null;
  }
}

/**
 * Save token and username to ~/.messcli with 0600 permissions.
 */
function saveToken(token, username) {
  const data = JSON.stringify({ token, username }, null, 2);
  fs.writeFileSync(CONFIG_PATH, data, { mode: 0o600 });
}

/**
 * Delete ~/.messcli (logout).
 */
function clear() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH);
    }
  } catch {
    // ignore
  }
}

module.exports = { getToken, getUsername, saveToken, clear };
