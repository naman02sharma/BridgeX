#!/usr/bin/env node

// Verify Database Setup
// Run with: node verify-setup.js

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

async function verifySetup() {
  console.log('🔍 Verifying database setup...')
  console.log('================================')

  const tables = ['profiles', 'alerts', 'responders', 'responder_locations', 'notifications', 'chat_messages']
  let allGood = true

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1)
      if (error) {
        console.log('❌', table + ':', error.message)
        allGood = false
      } else {
        console.log('✅', table + ': OK')
      }
    } catch (err) {
      console.log('❌', table + ':', err.message)
      allGood = false
    }
  }

  console.log('')

  if (allGood) {
    console.log('🎉 Database setup complete!')
    console.log('Next steps:')
    console.log('1. Run: node add-sample-data.js')
    console.log('2. Run: node test-supabase.js')
    console.log('3. Start your app: npm run dev')
  } else {
    console.log('❌ Some tables are missing or broken')
    console.log('Run setup-database.sql in Supabase SQL Editor again')
  }
}

verifySetup().catch(console.error)