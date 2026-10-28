#!/usr/bin/env node

// Test RLS Policies
// Run with: node test-rls.js

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

async function testRLS() {
  console.log('🔐 Testing RLS Policies')
  console.log('=======================')

  try {
    // Test 1: Try to select from alerts (should work if policy allows)
    console.log('Test 1: Selecting from alerts...')
    const { data: selectData, error: selectError } = await supabase
      .from('alerts')
      .select('*')
      .limit(1)

    if (selectError) {
      console.log('❌ Select failed:', selectError.message)
    } else {
      console.log('✅ Select OK, found', selectData?.length || 0, 'records')
    }

    // Test 2: Try to insert into alerts (should work with "Anyone can create alerts" policy)
    console.log('Test 2: Inserting into alerts...')
    const { data: insertData, error: insertError } = await supabase
      .from('alerts')
      .insert([
        {
          emergency_type: 'medical',
          urgency_level: 'high',
          message: 'Test emergency alert'
        }
      ])
      .select()

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message)
      console.log('This suggests RLS is blocking the insert')
    } else {
      console.log('✅ Insert OK, created alert:', insertData?.[0]?.id)
    }

    // Test 3: Check if we can access profiles (should fail without auth)
    console.log('Test 3: Accessing profiles...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (profileError) {
      console.log('❌ Profile access failed (expected):', profileError.message)
    } else {
      console.log('✅ Profile access OK (unexpected)')
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

testRLS().catch(console.error)