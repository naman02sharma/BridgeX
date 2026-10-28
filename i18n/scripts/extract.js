#!/usr/bin/env node

/**
 * Text Extraction Script for Lingo.dev
 * 
 * This script scans all React/Next.js files and extracts translatable strings
 * for Lingo.dev processing. It creates JSON files ready for translation.
 * 
 * Usage: node i18n/scripts/extract.js
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Configuration
const CONFIG = {
  sourceDir: path.join(__dirname, '../..'),
  outputDir: path.join(__dirname, '../extracted'),
  localesDir: path.join(__dirname, '../locales'),
  patterns: [
    'app/**/*.{tsx,ts}',
    'components/**/*.{tsx,ts}',
    'lib/**/*.{tsx,ts}',
  ],
  ignore: [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
  ],
  extractionPatterns: [
    // t() function calls
    /t\(\s*["'`]([^"'`]+)["'`]/g,
    // Direct string literals in JSX (between >text<)
    />([A-Z][^<]{3,})</g,
    // aria-label and title attributes
    /(?:aria-label|title)=["']([^"']+)["']/g,
    // placeholder attributes
    /placeholder=["']([^"']+)["']/g,
  ],
}

class StringExtractor {
  constructor() {
    this.extracted = new Map()
    this.sourceFiles = []
    this.stats = {
      filesScanned: 0,
      stringsExtracted: 0,
      duplicatesSkipped: 0,
    }
  }

  /**
   * Main extraction process
   */
  async extract() {
    console.log('🚀 Starting text extraction for Lingo.dev...\n')

    // Create output directories
    this.ensureDirectories()

    // Find all source files
    this.sourceFiles = this.findSourceFiles()
    console.log(`📂 Found ${this.sourceFiles.length} source files\n`)

    // Extract strings from each file
    for (const file of this.sourceFiles) {
      this.extractFromFile(file)
    }

    // Generate output files
    this.generateOutputFiles()

    // Print statistics
    this.printStats()

    console.log('\n✅ Extraction complete!\n')
  }

  /**
   * Ensure output directories exist
   */
  ensureDirectories() {
    [CONFIG.outputDir, CONFIG.localesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }

  /**
   * Find all source files matching patterns
   */
  findSourceFiles() {
    const files = []

    CONFIG.patterns.forEach(pattern => {
      const matches = glob.sync(pattern, {
        cwd: CONFIG.sourceDir,
        ignore: CONFIG.ignore,
        absolute: true,
      })
      files.push(...matches)
    })

    return [...new Set(files)] // Remove duplicates
  }

  /**
   * Extract strings from a single file
   */
  extractFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const relativePath = path.relative(CONFIG.sourceDir, filePath)

      this.stats.filesScanned++

      // Extract using each pattern
      CONFIG.extractionPatterns.forEach(pattern => {
        let match
        while ((match = pattern.exec(content)) !== null) {
          const text = match[1]?.trim()

          if (this.isValidString(text)) {
            this.addString(text, relativePath)
          }
        }
      })
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message)
    }
  }

  /**
   * Check if string is valid for extraction
   */
  isValidString(text) {
    if (!text || text.length < 3) return false
    if (/^[0-9]+$/.test(text)) return false // Pure numbers
    if (/^[^a-zA-Z]*$/.test(text)) return false // No letters
    if (text.includes('${') || text.includes('`')) return false // Template strings
    if (text.startsWith('http://') || text.startsWith('https://')) return false // URLs
    if (text.includes('className') || text.includes('onClick')) return false // Props

    return true
  }

  /**
   * Add string to extraction map
   */
  addString(text, sourcePath) {
    const key = this.generateKey(text)

    if (this.extracted.has(key)) {
      this.stats.duplicatesSkipped++
      this.extracted.get(key).sources.add(sourcePath)
    } else {
      this.extracted.set(key, {
        key,
        text,
        sources: new Set([sourcePath]),
      })
      this.stats.stringsExtracted++
    }
  }

  /**
   * Generate a consistent key from text
   */
  generateKey(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50)
  }

  /**
   * Generate output files for Lingo.dev
   */
  generateOutputFiles() {
    console.log('\n📝 Generating output files...\n')

    // Convert Map to object for JSON
    const extractedData = {}
    this.extracted.forEach((value, key) => {
      extractedData[key] = {
        text: value.text,
        sources: Array.from(value.sources),
      }
    })

    // Generate extracted.json (for reference)
    const extractedPath = path.join(CONFIG.outputDir, 'extracted.json')
    fs.writeFileSync(
      extractedPath,
      JSON.stringify(extractedData, null, 2),
      'utf-8'
    )
    console.log(`✓ Created ${extractedPath}`)

    // Generate en.json (source language for Lingo.dev)
    const enTranslations = {}
    this.extracted.forEach((value, key) => {
      enTranslations[key] = value.text
    })

    const enPath = path.join(CONFIG.localesDir, 'en.json')
    fs.writeFileSync(
      enPath,
      JSON.stringify(enTranslations, null, 2),
      'utf-8'
    )
    console.log(`✓ Created ${enPath}`)

    // Generate template for other languages
    const templateTranslations = {}
    this.extracted.forEach((value, key) => {
      templateTranslations[key] = '' // Empty for translation
    })

    const templatePath = path.join(CONFIG.outputDir, 'translation-template.json')
    fs.writeFileSync(
      templatePath,
      JSON.stringify(templateTranslations, null, 2),
      'utf-8'
    )
    console.log(`✓ Created ${templatePath}`)

    // Generate CSV for Lingo.dev (alternative format)
    this.generateCSV()
  }

  /**
   * Generate CSV format for Lingo.dev
   */
  generateCSV() {
    const csvLines = ['key,en,context']

    this.extracted.forEach((value, key) => {
      const escapedText = value.text.replace(/"/g, '""')
      const sources = Array.from(value.sources).join('; ')
      csvLines.push(`"${key}","${escapedText}","${sources}"`)
    })

    const csvPath = path.join(CONFIG.outputDir, 'translations.csv')
    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8')
    console.log(`✓ Created ${csvPath}`)
  }

  /**
   * Print extraction statistics
   */
  printStats() {
    console.log('\n📊 Extraction Statistics:')
    console.log(`   Files scanned: ${this.stats.filesScanned}`)
    console.log(`   Strings extracted: ${this.stats.stringsExtracted}`)
    console.log(`   Duplicates skipped: ${this.stats.duplicatesSkipped}`)
  }
}

// Run extraction
if (require.main === module) {
  const extractor = new StringExtractor()
  extractor.extract().catch(console.error)
}

module.exports = StringExtractor
