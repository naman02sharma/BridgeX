#!/usr/bin/env node

/**
 * Lingo.dev-Compatible Translation File Generator
 * 
 * Note: Lingo.dev is a Translation Management System (TMS), not a translation API.
 * This script generates translation files with fallback to English for new keys.
 * 
 * For production: Use Lingo.dev platform to manage translations:
 * 1. Push source keys to Lingo.dev: `npm run lingo:push`
 * 2. Translate on lingo.dev platform
 * 3. Pull translations: `npm run lingo:pull`
 */

// Load environment variables from .env.local
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') })

const fs = require('fs')
const path = require('path')

const LOCALES = ['es', 'fr', 'ru', 'de', 'ja', 'zh', 'ar', 'ko']
const SOURCE_FILE = path.join(__dirname, '../../public/i18n/locales/en.json')
const OUTPUT_DIR = path.join(__dirname, '../../public/i18n/locales')

// Glossary for emergency response terminology
const GLOSSARY = {
  'BridgeX': 'BridgeX',
  'SOS': 'SOS',
  'Responder': 'Responder',
  'Emergency': 'Emergency',
  'Alert': 'Alert',
}

async function translateLocale(locale) {
  console.log(`\n🌐 Processing ${locale.toUpperCase()}...`)

  const sourceTranslations = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'))
  const outputFile = path.join(OUTPUT_DIR, `${locale}.json`)

  // Load existing translations if available (preserves manual translations)
  let existingTranslations = {}
  if (fs.existsSync(outputFile)) {
    existingTranslations = JSON.parse(fs.readFileSync(outputFile, 'utf8'))
  }

  const translatedKeys = {}
  const keys = Object.keys(sourceTranslations)
  let preserved = 0
  let newKeys = 0

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const sourceText = sourceTranslations[key]

    // Preserve existing translations
    if (existingTranslations[key]) {
      translatedKeys[key] = existingTranslations[key]
      preserved++
    } else {
      // New key - use English as fallback (to be translated manually or via Lingo platform)
      translatedKeys[key] = sourceText
      newKeys++
    }

    // Progress indicator
    if ((i + 1) % 10 === 0 || i === keys.length - 1) {
      process.stdout.write(`\r   Progress: ${i + 1}/${keys.length} (${preserved} preserved, ${newKeys} new)`)
    }
  }

  // Save translated file
  fs.writeFileSync(outputFile, JSON.stringify(translatedKeys, null, 2))

  console.log(`\n   ✅ Saved ${locale}.json (${preserved} preserved, ${newKeys} new, ${keys.length} total)`)

  return { locale, preserved, newKeys, total: keys.length }
}

async function main() {
  console.log('🚀 Lingo-Compatible Translation File Generator')
  console.log('==============================================\n')

  console.log('ℹ️  Note: This script preserves existing translations and adds')
  console.log('   English fallback for new keys. Use Lingo.dev platform for')
  console.log('   professional translations, or run generate-all-translations.js')
  console.log('   for pre-translated content.\n')

  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Error: Source file not found: ${SOURCE_FILE}`)
    console.error('   Run extract-lingo.js first to generate en.json')
    process.exit(1)
  }

  const sourceTranslations = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'))
  console.log(`📝 Source file: ${SOURCE_FILE}`)
  console.log(`📊 Total keys: ${Object.keys(sourceTranslations).length}`)
  console.log(`🌍 Target locales: ${LOCALES.join(', ')}\n`)

  const results = []

  for (const locale of LOCALES) {
    try {
      const result = await translateLocale(locale)
      results.push(result)
    } catch (error) {
      console.error(`\n❌ Error translating ${locale}:`, error.message)
    }
  }

  // Summary
  console.log('\n\n📊 Translation Summary')
  console.log('======================')
  results.forEach(({ locale, preserved, newKeys, total }) => {
    const coverage = ((preserved / total) * 100).toFixed(1)
    console.log(`${locale.toUpperCase()}: ${coverage}% translated (${preserved} existing, ${newKeys} new keys need translation)`)
  })

  const hasNewKeys = results.some(r => r.newKeys > 0)
  if (hasNewKeys) {
    console.log('\n⚠️  New keys detected! Options to translate them:')
    console.log('   1. Run: node generate-all-translations.js (for pre-translated content)')
    console.log('   2. Use Lingo.dev platform for professional translations')
    console.log('   3. Manually edit locale JSON files')
  }

  console.log('\n✅ Translation files updated!')
  console.log('🚀 Next: Restart your Next.js dev server to load translations')
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { translateLocale }
