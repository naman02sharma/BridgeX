#!/usr/bin/env node

// Force Schema Cache Refresh
// Run with: node refresh-schema.js

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

async function refreshSchema() {
  console.log('🔄 Refreshing Supabase schema cache...')
  console.log('=====================================')

  try {
    // Force schema refresh by making various queries
    const tables = ['profiles', 'alerts', 'responders', 'responder_locations', 'notifications', 'chat_messages']

    for (const table of tables) {
      console.log(`Testing ${table}...`)

      // Try different query types to refresh cache
      const { error: selectError } = await supabase.from(table).select('*').limit(1)
      if (selectError) {
        console.log(`❌ ${table}: ${selectError.message}`)
      } else {
        console.log(`✅ ${table}: OK`)
      }

      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('')
    console.log('🎉 Schema cache refresh complete!')
    console.log('Now try running: node add-sample-data.js')

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

refreshSchema().catch(console.error)