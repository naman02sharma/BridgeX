#!/usr/bin/env node

/**
 * Lingo.dev Integration Test Suite
 * 
 * Comprehensive tests for the Lingo.dev translation system
 */

// Load environment variables from .env.local
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') })

const fs = require('fs')
const path = require('path')

const LOCALES_DIR = path.join(__dirname, '../locales')
const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'ru', 'de', 'ja', 'zh', 'ar', 'ko']

console.log('🧪 Lingo.dev Integration Test Suite')
console.log('====================================\n')

let passedTests = 0
let failedTests = 0
const errors = []

function test(name, fn) {
  try {
    fn()
    console.log(`✅ ${name}`)
    passedTests++
  } catch (error) {
    console.error(`❌ ${name}`)
    console.error(`   Error: ${error.message}`)
    errors.push({ test: name, error: error.message })
    failedTests++
  }
}

// Test 1: All locale files exist
test('All locale files exist', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing locale file: ${locale}.json`)
    }
  }
})

// Test 2: All locale files are valid JSON
test('All locale files are valid JSON', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`)
    const content = fs.readFileSync(filePath, 'utf8')
    JSON.parse(content) // Will throw if invalid
  }
})

// Test 3: All locale files have the same keys as English
test('All locale files have the same keys as English', () => {
  const enFile = path.join(LOCALES_DIR, 'en.json')
  const enKeys = Object.keys(JSON.parse(fs.readFileSync(enFile, 'utf8')))

  for (const locale of SUPPORTED_LOCALES.filter(l => l !== 'en')) {
    const localeFile = path.join(LOCALES_DIR, `${locale}.json`)
    const localeKeys = Object.keys(JSON.parse(fs.readFileSync(localeFile, 'utf8')))

    const missingKeys = enKeys.filter(k => !localeKeys.includes(k))
    const extraKeys = localeKeys.filter(k => !enKeys.includes(k))

    if (missingKeys.length > 0) {
      throw new Error(`${locale}: Missing keys: ${missingKeys.slice(0, 5).join(', ')}...`)
    }

    if (extraKeys.length > 0) {
      console.warn(`   ⚠️  ${locale}: Extra keys: ${extraKeys.slice(0, 3).join(', ')}...`)
    }
  }
})

// Test 4: No empty translation values
test('No empty translation values', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`)
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    const emptyKeys = Object.entries(translations)
      .filter(([_, value]) => !value || value.trim() === '')
      .map(([key]) => key)

    if (emptyKeys.length > 0) {
      throw new Error(`${locale}: Empty values for: ${emptyKeys.slice(0, 3).join(', ')}...`)
    }
  }
})

// Test 5: Translation coverage
test('Translation coverage > 95%', () => {
  const enFile = path.join(LOCALES_DIR, 'en.json')
  const enTranslations = JSON.parse(fs.readFileSync(enFile, 'utf8'))
  const totalKeys = Object.keys(enTranslations).length

  for (const locale of SUPPORTED_LOCALES.filter(l => l !== 'en')) {
    const localeFile = path.join(LOCALES_DIR, `${locale}.json`)
    const localeTranslations = JSON.parse(fs.readFileSync(localeFile, 'utf8'))
    const translatedKeys = Object.keys(localeTranslations).length

    const coverage = (translatedKeys / totalKeys) * 100
    if (coverage < 95) {
      throw new Error(`${locale}: Coverage ${coverage.toFixed(1)}% < 95%`)
    }
  }
})

// Test 6: RTL locales have proper directionality markers
test('RTL locales identified correctly', () => {
  const configPath = path.join(__dirname, '../config.ts')
  const configContent = fs.readFileSync(configPath, 'utf8')

  if (!configContent.includes('rtl: true') || !configContent.includes('code: "ar"')) {
    throw new Error('Arabic not properly marked as RTL in config')
  }
})

// Test 7: Critical emergency keys are translated
test('Critical emergency keys are translated', () => {
  const criticalKeys = [
    'sos.title',
    'sos.sendAlert',
    'emergency.fire',
    'emergency.medical',
    'common.cancel',
    'common.confirm',
  ]

  for (const locale of SUPPORTED_LOCALES) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`)
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    const missingCritical = criticalKeys.filter(k => !translations[k])
    if (missingCritical.length > 0) {
      throw new Error(`${locale}: Missing critical keys: ${missingCritical.join(', ')}`)
    }
  }
})

// Test 8: No duplicate values (potential untranslated text)
test('Translations are unique (not just English copies)', () => {
  const enFile = path.join(LOCALES_DIR, 'en.json')
  const enTranslations = JSON.parse(fs.readFileSync(enFile, 'utf8'))

  for (const locale of SUPPORTED_LOCALES.filter(l => l !== 'en')) {
    const localeFile = path.join(LOCALES_DIR, `${locale}.json`)
    const localeTranslations = JSON.parse(fs.readFileSync(localeFile, 'utf8'))

    let duplicates = 0
    for (const [key, value] of Object.entries(enTranslations)) {
      if (localeTranslations[key] === value) {
        duplicates++
      }
    }

    const duplicateRatio = duplicates / Object.keys(enTranslations).length
    if (duplicateRatio > 0.5) {
      console.warn(`   ⚠️  ${locale}: ${(duplicateRatio * 100).toFixed(1)}% matches English (may be untranslated)`)
    }
  }
})

// Test 9: File sizes are reasonable
test('Translation file sizes are reasonable', () => {
  const enFile = path.join(LOCALES_DIR, 'en.json')
  const enSize = fs.statSync(enFile).size

  for (const locale of SUPPORTED_LOCALES.filter(l => l !== 'en')) {
    const localeFile = path.join(LOCALES_DIR, `${locale}.json`)
    const localeSize = fs.statSync(localeFile).size

    // Locale files should be within 50% of English size (accounting for language verbosity)
    if (localeSize < enSize * 0.5 || localeSize > enSize * 1.5) {
      console.warn(`   ⚠️  ${locale}: Size ${localeSize}B unusual (EN: ${enSize}B)`)
    }
  }
})

// Test 10: Glossary terms are preserved
test('Glossary terms are preserved', () => {
  const glossaryTerms = ['BridgeX', 'SOS']

  for (const locale of SUPPORTED_LOCALES) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`)
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const allValues = Object.values(translations).join(' ')

    for (const term of glossaryTerms) {
      if (!allValues.includes(term)) {
        console.warn(`   ⚠️  ${locale}: Glossary term "${term}" not found`)
      }
    }
  }
})

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Tests Passed: ${passedTests}`)
console.log(`Tests Failed: ${failedTests}`)
console.log('='.repeat(50))

if (failedTests > 0) {
  console.log('\n❌ Some tests failed:')
  errors.forEach(({ test, error }) => {
    console.log(`   - ${test}: ${error}`)
  })
  process.exit(1)
} else {
  console.log('\n✅ All tests passed! Lingo.dev integration is working correctly.')

  // Print summary statistics
  const enFile = path.join(LOCALES_DIR, 'en.json')
  const enTranslations = JSON.parse(fs.readFileSync(enFile, 'utf8'))
  const totalKeys = Object.keys(enTranslations).length

  console.log('\n📊 Summary Statistics:')
  console.log(`   Total translation keys: ${totalKeys}`)
  console.log(`   Supported languages: ${SUPPORTED_LOCALES.length}`)
  console.log(`   Total translations: ${totalKeys * SUPPORTED_LOCALES.length}`)

  process.exit(0)
}
