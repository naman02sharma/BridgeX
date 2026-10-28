import { classifyEmergency } from "../lib/emergency-classifier";

const userArg = process.argv.slice(2).join(" ").trim();

if (userArg) {
  console.log("==================================================");
  console.log("🚨 BridgeX Emergency Classification Result");
  console.log("==================================================");
  const result = classifyEmergency(userArg);
  console.log(`Input: "${userArg}"`);
  console.log(`Category: [${result.category.toUpperCase()}] ${result.label}`);
  console.log(`Confidence: ${result.confidence.toUpperCase()}`);
  console.log(`Department: ${result.organization}`);
  console.log(`Emergency Helpline: ${result.helpline}`);
  console.log(`Keywords Matched: ${JSON.stringify(result.keywordsMatched)}`);
  console.log("==================================================");
} else {
  console.log("==================================================");
  console.log("🚨 BridgeX Multilingual Emergency Classifier Demo");
  console.log("==================================================");
  const sampleQueries = [
    { text: "Severe chest pain and difficulty breathing, need an ambulance immediately!", expected: "medical" },
    { text: "Fire in the 4th floor apartment, heavy smoke everywhere!", expected: "fire" },
    { text: "Armed robbery in progress! Someone broke in with a knife!", expected: "security" },
    { text: "छातीत खूप दुखत आहे, ताबडतोब रुग्णवाहिका पाठवा", expected: "medical" },
    { text: "इमारतीत भीषण आग लागली आहे, अग्निशामक दल पाठवा", expected: "fire" },
    { text: "चोर घरात शिरला आहे, बंदूक दाखवून धमकावत आहे, पोलीस बोलवा", expected: "security" },
    { text: "chori ho gayi aur chaku mara, police van bhejo", expected: "security" },
    { text: "cylinder blast zala aag lagli bamb pathva", expected: "fire" },
    { text: "accident jhala khoon nikal raha hai ambulance pathva", expected: "medical" },
    { text: "സഹായിക്കൂ! കടുത്ത നെഞ്ചുവേദന, ബോധംകെട്ടു", expected: "medical" },
    { text: "ਆਸਪਾਸ ਅੱਗ ਲੱਗ ਗਈ, ਧੂੰਆਂ ਬਹੁਤ ਹੈ", expected: "fire" },
    { text: "ਘਰ ਵਿੱਚ ਚੋਰ ਵੜ ਗਏ, ਪੁਲਿਸ ਨੂੰ ਬੁਲਾਓ", expected: "security" },
  ];

  let passCount = 0;
  for (const sample of sampleQueries) {
    const result = classifyEmergency(sample.text);
    const ok = result.category === sample.expected;
    if (ok) passCount++;
    console.log(`\nInput: "${sample.text}"`);
    console.log(`Detected: [${result.category.toUpperCase()}] ${result.label} (${result.confidence.toUpperCase()} confidence)`);
    console.log(`Dept: ${result.organization} | Helpline: ${result.helpline}`);
    console.log(`Keywords Matched: ${JSON.stringify(result.keywordsMatched)}`);
    console.log(`Status: ${ok ? "✅ PASS" : "❌ MISMATCH"}`);
  }
  console.log("\n==================================================");
  console.log(`Results: ${passCount}/${sampleQueries.length} test cases verified successfully.`);
  console.log("==================================================");
}
