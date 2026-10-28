/**
 * Verify Migration - Check Missing Tables and Columns
 * Run with: node verify-migration.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!')
    console.log('Please create .env.local from .env.example')
    process.exit(1)
  }

  const envFile = fs.readFileSync(envPath, 'utf8')
  const envVars = {}

  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    }
  })

  return envVars
}

const env = loadEnv()

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables!')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const REQUIRED_SCHEMA = {
  profiles: ['id', 'email', 'role', 'organization', 'verified', 'languages', 'created_at'],
  alerts: ['id', 'user_id', 'emergency_type', 'urgency_level', 'message', 'original_message',
    'language_code', 'location', 'status', 'panic_mode', 'panic_timer', 'responders',
    'metadata', 'created_at', 'updated_at'],
  responders: ['id', 'user_id', 'organization', 'verification_status', 'specializations',
    'response_radius', 'available', 'current_location', 'created_at', 'updated_at'],
  responder_locations: ['id', 'responder_id', 'location', 'altitude', 'accuracy', 'heading',
    'speed', 'battery_level', 'network_type', 'updated_at'],
  notifications: ['id', 'user_id', 'alert_id', 'title', 'body', 'message', 'type', 'priority',
    'read', 'data', 'created_at'],
  chat_messages: ['id', 'alert_id', 'sender_id', 'sender_type', 'content', 'translated_content',
    'message_type', 'created_at'],
  push_subscriptions: ['id', 'user_id', 'subscription', 'endpoint', 'created_at', 'updated_at']
}

async function verifyMigration() {
  console.log('🔍 Verifying BridgeX Database Migration...\n')

  const results = {
    missingTables: [],
    missingColumns: {},
    existingTables: [],
    errors: []
  }

  for (const [table, requiredColumns] of Object.entries(REQUIRED_SCHEMA)) {
    try {
      // Try to query the table
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          results.missingTables.push(table)
          console.log(`❌ Table missing: ${table}`)
        } else {
          results.errors.push({ table, error: error.message })
          console.log(`⚠️  Error accessing ${table}: ${error.message}`)
        }
      } else {
        results.existingTables.push(table)
        console.log(`✅ Table exists: ${table}`)

        // Check columns if we got data or can check schema
        if (data && data.length > 0) {
          const actualColumns = Object.keys(data[0])
          const missing = requiredColumns.filter(col => !actualColumns.includes(col))

          if (missing.length > 0) {
            results.missingColumns[table] = missing
            console.log(`   ⚠️  Missing columns in ${table}: ${missing.join(', ')}`)
          } else {
            console.log(`   ✅ All required columns present`)
          }
        } else {
          console.log(`   ℹ️  No data to verify columns (table is empty)`)
        }
      }
    } catch (err) {
      results.errors.push({ table, error: err.message })
      console.log(`❌ Unexpected error with ${table}: ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(60))

  console.log(`\n✅ Existing Tables (${results.existingTables.length}/${Object.keys(REQUIRED_SCHEMA).length}):`)
  results.existingTables.forEach(t => console.log(`   - ${t}`))

  if (results.missingTables.length > 0) {
    console.log(`\n❌ Missing Tables (${results.missingTables.length}):`)
    results.missingTables.forEach(t => console.log(`   - ${t}`))
  }

  if (Object.keys(results.missingColumns).length > 0) {
    console.log(`\n⚠️  Tables with Missing Columns:`)
    Object.entries(results.missingColumns).forEach(([table, cols]) => {
      console.log(`   ${table}: ${cols.join(', ')}`)
    })
  }

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors Encountered:`)
    results.errors.forEach(({ table, error }) => {
      console.log(`   ${table}: ${error}`)
    })
  }

  console.log('\n' + '='.repeat(60))

  if (results.missingTables.length === 0 && Object.keys(results.missingColumns).length === 0) {
    console.log('🎉 SUCCESS! All required tables and columns are present.')
    console.log('\nYou can now:')
    console.log('1. Test push notifications API: POST /api/push')
    console.log('2. Test chat with sender_type: POST /api/chat/messages')
    console.log('3. Run the application: npm run dev')
    return true
  } else {
    console.log('⚠️  MIGRATION NEEDED!')
    console.log('\nTo fix missing items:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Copy and paste the contents of: add-missing-tables.sql')
    console.log('3. Click "Run" to execute the migration')
    console.log('4. Run this verification script again: node verify-migration.js')
    return false
  }
}

// Run verification
verifyMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
