#!/usr/bin/env node

/**
 * Dashboard Setup Verification Script
 * Tests Supabase connection and database schema
 */

const { createClient } = require('@supabase/supabase-js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function verifyDashboardSetup() {
  log('\n🔍 Dashboard Setup Verification\n', colors.cyan);

  // Check environment variables
  log('1️⃣  Checking environment variables...', colors.blue);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    log('   ❌ NEXT_PUBLIC_SUPABASE_URL not found', colors.red);
    return false;
  } else {
    log(`   ✅ NEXT_PUBLIC_SUPABASE_URL: ${url}`, colors.green);
  }

  if (!anonKey) {
    log('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found', colors.red);
    return false;
  } else {
    log(`   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey.substring(0, 20)}...`, colors.green);
  }

  if (!serviceKey) {
    log('   ⚠️  SUPABASE_SERVICE_ROLE_KEY not found (optional)', colors.yellow);
  } else {
    log(`   ✅ SUPABASE_SERVICE_ROLE_KEY: ${serviceKey.substring(0, 20)}...`, colors.green);
  }

  // Test Supabase connection
  log('\n2️⃣  Testing Supabase connection...', colors.blue);
  const supabase = createClient(url, serviceKey || anonKey);

  try {
    const { data, error } = await supabase.from('alerts').select('count', { count: 'exact', head: true });

    if (error) {
      log(`   ❌ Connection failed: ${error.message}`, colors.red);
      log(`   Hint: Check if your API keys are correct`, colors.yellow);
      return false;
    }

    log('   ✅ Connected to Supabase successfully', colors.green);
  } catch (err) {
    log(`   ❌ Connection error: ${err.message}`, colors.red);
    return false;
  }

  // Check required tables
  log('\n3️⃣  Checking database tables...', colors.blue);
  const requiredTables = ['alerts', 'notifications', 'responders'];

  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);

      if (error) {
        log(`   ❌ Table '${table}' error: ${error.message}`, colors.red);
      } else {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        log(`   ✅ Table '${table}' exists (${count || 0} rows)`, colors.green);
      }
    } catch (err) {
      log(`   ❌ Table '${table}' check failed: ${err.message}`, colors.red);
    }
  }

  // Check required functions
  log('\n4️⃣  Checking database functions...', colors.blue);
  const requiredFunctions = [
    { name: 'get_alert_trends', params: { days_back: 7 } },
    { name: 'get_response_time_analytics', params: { days_back: 7 } },
  ];

  for (const func of requiredFunctions) {
    try {
      const { data, error } = await supabase.rpc(func.name, func.params);

      if (error) {
        log(`   ❌ Function '${func.name}' error: ${error.message}`, colors.red);
        log(`   Hint: Run dashboard-realtime-updates.sql in Supabase SQL Editor`, colors.yellow);
      } else {
        log(`   ✅ Function '${func.name}' exists`, colors.green);
      }
    } catch (err) {
      log(`   ❌ Function '${func.name}' check failed: ${err.message}`, colors.red);
    }
  }

  // Check Realtime configuration
  log('\n5️⃣  Checking Realtime configuration...', colors.blue);
  try {
    const channel = supabase.channel('test-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => { })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          log('   ✅ Realtime subscriptions working', colors.green);
          supabase.removeChannel(channel);
        } else if (status === 'CHANNEL_ERROR') {
          log('   ❌ Realtime subscription error', colors.red);
          log('   Hint: Enable Realtime in Supabase Dashboard → Database → Replication', colors.yellow);
        }
      });

    // Wait a bit for subscription
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (err) {
    log(`   ❌ Realtime check failed: ${err.message}`, colors.red);
  }

  log('\n✅ Verification complete!\n', colors.cyan);

  log('Next steps:', colors.blue);
  log('  1. If you see ❌ errors above, fix them before proceeding', colors.yellow);
  log('  2. Run the SQL migration: dashboard-realtime-updates.sql', colors.yellow);
  log('  3. Visit http://localhost:3000/dashboard to test', colors.yellow);
  log('  4. Check DASHBOARD_SETUP_GUIDE.md for detailed instructions\n', colors.yellow);

  process.exit(0);
}

// Run verification
verifyDashboardSetup().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, colors.red);
  process.exit(1);
});
