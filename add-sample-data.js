#!/usr/bin/env node

// Add Sample Data to Supabase
// Run with: node add-sample-data.js

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

// Use anon key for operations that work with RLS
const supabase = createClient(supabaseUrl, supabaseKey)

async function addSampleData() {
  console.log('🚨 Adding Sample Data to BridgeX')
  console.log('===================================')
  console.log('Note: Using anon key - can only add data allowed by RLS policies')
  console.log('')

  try {
    // Add sample alert (allowed by RLS - anyone can create alerts)
    console.log('Adding sample alert...')
    const { data: alerts, error: alertError } = await supabase
      .from('alerts')
      .insert([
        {
          emergency_type: 'medical',
          urgency_level: 'high',
          message: 'Medical emergency - unconscious person',
          location: {
            lat: 27.1667,
            lng: 75.9846,
            address: 'Jaipur, Rajasthan, India'
          }
        }
      ])
      .select()

    if (alertError) {
      console.error('❌ Error adding alert:', alertError.message)
    } else {
      console.log('✅ Added alert:', alerts?.length || 0)
    }

    console.log('')
    console.log('⚠️  Note: Responder data requires authentication')
    console.log('To add responders and locations:')
    console.log('1. Sign up users in your app')
    console.log('2. Or temporarily disable RLS for testing:')
    console.log('   ALTER TABLE responders DISABLE ROW LEVEL SECURITY;')
    console.log('   ALTER TABLE responder_locations DISABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('For now, let\'s test with the alert data...')

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

addSampleData()