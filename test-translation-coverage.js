const fs = require('fs');
const path = require('path');

console.log('🧪 TRANSLATION COVERAGE TEST\n');

// Languages to test
const languages = ['en', 'es', 'fr', 'ru', 'de', 'ja', 'zh', 'ar', 'ko'];

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

function getMissingKeys(english, target) {
  const missing = [];

  function checkKeys(enObj, targetObj, path = '') {
    for (const key in enObj) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof enObj[key] === 'object' && enObj[key] !== null) {
        if (!targetObj[key] || typeof targetObj[key] !== 'object') {
          missing.push(currentPath);
        } else {
          checkKeys(enObj[key], targetObj[key], currentPath);
        }
      } else {
        if (!(key in targetObj)) {
          missing.push(currentPath);
        }
      }
    }
  }

  checkKeys(english, target);
  return missing;
}

// Load English as reference
const englishPath = path.join(__dirname, 'public', 'i18n', 'locales', 'en.json');
const english = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
const englishKeyCount = countKeys(english);

console.log(`📖 English reference: ${englishKeyCount} keys\n`);

let allComplete = true;

languages.forEach(lang => {
  const langPath = path.join(__dirname, 'public', 'i18n', 'locales', `${lang}.json`);

  if (!fs.existsSync(langPath)) {
    console.log(`❌ ${lang}: File not found`);
    allComplete = false;
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    const keyCount = countKeys(data);
    const missingKeys = getMissingKeys(english, data);

    if (missingKeys.length === 0) {
      console.log(`✅ ${lang}: ${keyCount}/${englishKeyCount} keys (100% coverage)`);
    } else {
      console.log(`❌ ${lang}: ${keyCount}/${englishKeyCount} keys (${missingKeys.length} missing)`);
      console.log(`   Missing: ${missingKeys.slice(0, 5).join(', ')}${missingKeys.length > 5 ? '...' : ''}`);
      allComplete = false;
    }
  } catch (error) {
    console.log(`❌ ${lang}: Parse error - ${error.message}`);
    allComplete = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allComplete) {
  console.log('🎉 SUCCESS: All languages have 100% translation key coverage!');
  console.log('🔄 Translation files are ready for production use.');
} else {
  console.log('⚠️  WARNING: Some languages are missing translation keys.');
  console.log('🔧 Run the sync script again or manually add missing keys.');
}

console.log('\n💡 Next steps:');
console.log('   1. Translate English fallback strings to native languages');
console.log('   2. Test UI components with different language selections');
console.log('   3. Integrate with Lingo.dev API for automated translations');