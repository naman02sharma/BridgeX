#!/usr/bin/env node

// Simple Supabase Connection Test
// Run with: node test-supabase.js

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      if (value) {
        process.env[key.trim()] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  console.log('')

  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)

    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }

    console.log('✅ Basic connection successful')
    return true
  } catch (err) {
    console.error('❌ Connection error:', err.message)
    return false
  }
}

async function testTables() {
  const tables = ['profiles', 'alerts', 'responders', 'responder_locations', 'notifications', 'chat_messages']

  console.log('')
  console.log('🔍 Testing database tables...')

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${count || 0} records`)
      }
    } catch (err) {
      console.error(`❌ ${table}: ${err.message}`)
    }
  }
}

async function testRealtime() {

  try {
    // Test realtime subscription to responder_locations
    const channel = supabase
      .channel('test-locations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'responder_locations'
      }, (payload) => {
        console.log('📡 Realtime update received:', payload.eventType, payload.new?.status || payload.old?.status)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription successful')
        } else {
          console.log('❌ Realtime subscription failed:', status)
        }
      })

    // Wait a bit for subscription
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test inserting a location update
    const { error: insertError } = await supabase
      .from('responder_locations')
      .upsert({
        responder_id: '660e8400-e29b-41d4-a716-446655440001',
        latitude: 27.1767 + (Math.random() - 0.5) * 0.01,
        longitude: 75.9846 + (Math.random() - 0.5) * 0.01,
        status: 'available',
        accuracy: 5.0,
        active: true,
        last_updated: new Date().toISOString()
      })

    if (insertError) {
      console.error('❌ Realtime insert failed:', insertError.message)
    } else {
      console.log('✅ Realtime insert successful')
    }

    // Wait for potential realtime updates
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Cleanup
    supabase.removeChannel(channel)

  } catch (err) {
    console.error('❌ Realtime test error:', err.message)
  }
}

async function main() {
  console.log('🚨 BridgeX Database Connection Test')
  console.log('=====================================')
  console.log('')

  const connected = await testConnection()
  if (connected) {
    await testTables()
    await testRealtime()
  }

  console.log('')
  console.log('📋 Next Steps:')
  console.log('1. If tables are missing, run the SQL migration in Supabase Dashboard')
  console.log('2. Go to: https://supabase.com/dashboard')
  console.log('3. Select your project')
  console.log('4. Go to SQL Editor')
  console.log('5. Copy/paste contents of supabase-migration.sql')
  console.log('6. Click "Run"')
  console.log('7. (Optional) Run sample-data.sql for test data')
  console.log('')
  console.log('8. Re-run this test: node test-supabase.js')
}

main().catch(console.error)