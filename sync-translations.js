const fs = require('fs');
const path = require('path');

// Languages to generate (excluding English which is the source)
const languages = ['es', 'fr', 'ru', 'de', 'ja', 'zh', 'ar', 'ko'];

console.log('🔄 Syncing translation files with complete English key coverage...\n');

// Read the complete English translations
const englishPath = path.join(__dirname, 'public', 'i18n', 'locales', 'en.json');
const englishData = JSON.parse(fs.readFileSync(englishPath, 'utf8'));

console.log(`📖 Loaded English translations with ${Object.keys(englishData).length} top-level keys`);

languages.forEach(lang => {
  console.log(`\n🔄 Processing ${lang}...`);

  // Try to read existing translations for this language
  let existingData = {};
  const langPath = path.join(__dirname, 'public', 'i18n', 'locales', `${lang}.json`);

  if (fs.existsSync(langPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
      console.log(`  📖 Found existing ${lang} translations`);
    } catch (error) {
      console.log(`  ⚠️  Could not parse existing ${lang} file, starting fresh`);
    }
  } else {
    console.log(`  📝 Creating new ${lang} translation file`);
  }

  // Deep merge function to preserve existing translations and add missing English keys
  function deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // Nested object - recurse
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        // Use existing translation if available, otherwise use English fallback
        result[key] = result[key] !== undefined ? result[key] : source[key];
      }
    }

    return result;
  }

  // Merge existing translations with complete English data
  const mergedData = deepMerge(existingData, englishData);

  // Count translations
  function countKeys(obj) {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += countKeys(obj[key]);
      } else {
        count++;
      }
    }
    return count;
  }

  const totalKeys = countKeys(mergedData);
  const englishKeys = countKeys(englishData);
  const existingKeys = countKeys(existingData);

  console.log(`  📊 ${lang}: ${existingKeys} existing, ${totalKeys - existingKeys} added from English, ${totalKeys}/${englishKeys} total coverage`);

  // Write to both locations (public and i18n directories)
  const publicPath = path.join(__dirname, 'public', 'i18n', 'locales', `${lang}.json`);
  const i18nPath = path.join(__dirname, 'i18n', 'locales', `${lang}.json`);

  // Ensure directories exist
  fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  fs.mkdirSync(path.dirname(i18nPath), { recursive: true });

  // Write files
  fs.writeFileSync(publicPath, JSON.stringify(mergedData, null, 2), 'utf8');
  fs.writeFileSync(i18nPath, JSON.stringify(mergedData, null, 2), 'utf8');

  console.log(`  ✅ Generated ${lang}.json with complete key coverage`);
});

console.log('\n🎉 Translation sync complete!');
console.log('📝 All 8 language files now have 100% key coverage from English');
console.log('🔄 Existing translations preserved, missing keys filled with English fallbacks');
console.log('\n💡 Next steps:');
console.log('   1. Review and translate the English fallback strings in each language file');
console.log('   2. Test the application with different language selections');
console.log('   3. Consider integrating with Lingo.dev API for automated translations');