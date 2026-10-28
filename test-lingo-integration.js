/**
 * Test Script for Lingo.dev Integration
 * 
 * Tests:
 * 1. Translation API with Lingo.dev SDK
 * 2. Language Detection with Lingo.dev SDK
 * 3. Emergency text translation
 */

async function testLingoTranslation() {
  console.log('\n🧪 Testing Lingo.dev Translation API...\n')

  const testCases = [
    {
      text: 'I need urgent medical help',
      targetLang: 'es',
      sourceLang: 'en'
    },
    {
      text: 'Fire in the building!',
      targetLang: 'fr',
      sourceLang: 'en'
    },
    {
      text: 'Someone is hurt badly',
      targetLang: 'de',
      sourceLang: 'en'
    }
  ]

  for (const testCase of testCases) {
    try {
      const response = await fetch('http://localhost:3000/api/lingo/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase)
      })

      const result = await response.json()

      if (result.provider === 'lingo.dev') {
        console.log('✅ SUCCESS:', {
          original: testCase.text,
          translated: result.translatedText,
          target: testCase.targetLang,
          provider: result.provider,
          confidence: result.confidence
        })
      } else {
        console.log('⚠️  FALLBACK:', {
          original: testCase.text,
          provider: result.provider,
          error: result.error
        })
      }
    } catch (error) {
      console.error('❌ ERROR:', error.message)
    }
  }
}

async function testLingoDetection() {
  console.log('\n🧪 Testing Lingo.dev Language Detection API...\n')

  const testTexts = [
    'Hello, I need help',
    'Ayuda por favor',
    'Bonjour, j\'ai besoin d\'aide',
    'Помогите пожалуйста',
    '助けてください'
  ]

  for (const text of testTexts) {
    try {
      const response = await fetch('http://localhost:3000/api/lingo/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      const result = await response.json()

      console.log('✅ DETECTED:', {
        text: text.substring(0, 30),
        language: result.detectedLang,
        provider: result.provider,
        confidence: result.confidence
      })
    } catch (error) {
      console.error('❌ ERROR:', error.message)
    }
  }
}

async function runTests() {
  console.log('🌍 LINGO.DEV INTEGRATION TEST SUITE\n')
  console.log('='.repeat(60))

  await testLingoTranslation()
  await testLingoDetection()

  console.log('\n' + '='.repeat(60))
  console.log('\n✅ All tests completed!\n')
}

runTests().catch(console.error)
