const { translateText, detectLanguage, classifyEmergency } = require('../lib/translation')

describe('Localization Tests', () => {
  test('Translate emergency message to Spanish', async () => {
    const result = await translateText('Help! There is a fire!', 'es')
    expect(result.translatedText).toBeTruthy()
    expect(result.sourceLang).toBe('en')
    expect(result.targetLang).toBe('es')
    expect(result.confidence).toBeGreaterThan(0)
  }, 10000)

  test('Detect language of Spanish text', async () => {
    const lang = await detectLanguage('¡Ayuda! Hay un incendio!')
    expect(lang).toBe('es')
  }, 5000)

  test('Classify emergency message', async () => {
    const classification = await classifyEmergency('There is a fire in the building!')
    expect(classification.type).toBe('fire')
    expect(['low', 'medium', 'high', 'critical']).toContain(classification.severity)
    expect(Array.isArray(classification.keywords)).toBe(true)
  }, 5000)

  test('Translation fallback on failure', async () => {
    // Mock a failure scenario
    const result = await translateText('Test message', 'invalid-lang')
    expect(result.translatedText).toBe('Test message') // Should fallback
  })
})