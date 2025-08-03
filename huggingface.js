const fetch = require('node-fetch');
const HF_TOKEN = process.env.HF_TOKEN;

async function getHuggingFaceResponse(prompt) {
  try {
    const API_URL = 'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta';
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt }),
      timeout: 10000 // 10 secondes max
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Hugging Face API Error: ${response.status} ${response.statusText}\n` +
        `Details: ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    
    // Gestion des différents formats de réponse
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }
    if (data.generated_text) {
      return data.generated_text;
    }
    if (data.error) {
      throw new Error(`Model loading: ${data.error}`);
    }
    
    return JSON.stringify(data);
  } catch (error) {
    console.error('Erreur détaillée:', error.message);
    throw error; // Propage l'erreur pour un logging complet
  }
}

module.exports = { getHuggingFaceResponse };
module.exports = { getHuggingFaceResponse };
