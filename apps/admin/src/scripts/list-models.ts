import "dotenv/config";

async function checkAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in your .env file.");
    return;
  }

  console.log("🔍 Fetching authorized models from Google AI Studio...\n");

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.models) {
      data.models.forEach((model: any) => {
        // We only care about models that support 'generateContent' for your AI Agent
        if (model.supportedGenerationMethods.includes("generateContent")) {
           console.log(`✅ Model ID: ${model.name.replace('models/', '')}`);
           console.log(`   Name: ${model.displayName}`);
           console.log(`   Version: ${model.version}`);
           console.log("   -------------------------------------------------");
        }
      });
    } else {
      console.error("❌ API Error:", data);
    }
  } catch (error) {
    console.error("❌ Network Error:", error);
  }
}

checkAvailableModels();