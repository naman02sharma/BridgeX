/**
 * API Key Verification Script
 * Tests all API keys in .env.local to ensure they're working
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testSupabaseAPI() {
  console.log('\n🔍 Testing Supabase API...');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log('❌ Supabase credentials missing');
    return false;
  }

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (response.ok || response.status === 404) {
      console.log('✅ Supabase API is working');
      console.log(`   URL: ${url}`);
      return true;
    } else {
      console.log(`❌ Supabase API failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Supabase API error:', error.message);
    return false;
  }
}

async function testGoogleAIAPI() {
  console.log('\n🔍 Testing Google AI API...');
  const key = process.env.GOOGLE_AI_API_KEY;

  if (!key) {
    console.log('❌ Google AI API key missing');
    return false;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Google AI API is working');
      console.log(`   Available models: ${data.models?.length || 0}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Google AI API failed with status: ${response.status}`);
      console.log(`   Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Google AI API error:', error.message);
    return false;
  }
}

async function testLingoAPI() {
  console.log('\n🔍 Testing Lingo.dev API...');
  const key = process.env.LINGO_API_KEY;

  if (!key) {
    console.log('❌ Lingo API key missing');
    return false;
  }

  try {
    // Test with a simple translation request
    const response = await fetch('https://api.lingo.dev/v1/translate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'Hello',
        targetLanguage: 'es',
        sourceLanguage: 'en'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Lingo.dev API is working');
      console.log(`   Test translation: "Hello" → "${data.translatedText || data.translation || 'success'}"`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Lingo.dev API failed with status: ${response.status}`);
      console.log(`   Error: ${error}`);

      // Lingo.dev might use different endpoint or format
      console.log('⚠️  Note: Lingo.dev API endpoint may need adjustment');
      return false;
    }
  } catch (error) {
    console.log('❌ Lingo.dev API error:', error.message);
    console.log('⚠️  Note: Verify the correct Lingo.dev API endpoint and format');
    return false;
  }
}

async function testVAPIDKeys() {
  console.log('\n🔍 Testing VAPID Keys (Push Notifications)...');
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.log('❌ VAPID keys missing');
    return false;
  }

  // Basic validation - VAPID keys should be base64url encoded
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;

  if (!base64UrlRegex.test(publicKey) || !base64UrlRegex.test(privateKey)) {
    console.log('❌ VAPID keys have invalid format');
    return false;
  }

  console.log('✅ VAPID keys are present and properly formatted');
  console.log(`   Public key length: ${publicKey.length} chars`);
  return true;
}

async function main() {
  console.log('🚀 GlobalSOS API Key Verification\n');
  console.log('='.repeat(50));

  const results = {
    supabase: await testSupabaseAPI(),
    googleAI: await testGoogleAIAPI(),
    lingo: await testLingoAPI(),
    vapid: await testVAPIDKeys()
  };

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Summary:');
  console.log(`   Supabase: ${results.supabase ? '✅' : '❌'}`);
  console.log(`   Google AI: ${results.googleAI ? '✅' : '❌'}`);
  console.log(`   Lingo.dev: ${results.lingo ? '✅ / ⚠️' : '❌'}`);
  console.log(`   VAPID Keys: ${results.vapid ? '✅' : '❌'}`);

  const allWorking = Object.values(results).every(r => r);

  if (allWorking) {
    console.log('\n✅ All API keys are configured correctly!');
  } else {
    console.log('\n⚠️  Some API keys need attention. Check the details above.');
  }
}

main().catch(console.error);
