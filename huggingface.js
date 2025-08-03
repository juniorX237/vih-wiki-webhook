onst fetch = require('node-fetch');
c
const HF_TOKEN = process.env.HF_TOKEN;

async function getHuggingFaceResponse(prompt) {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta', // Tu peux changer de modèle plus tard
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    }
  );
  if (!response.ok) throw new Error('Problème avec Hugging Face');
  const data = await response.json();
  // Adaptation selon le modèle choisi
  if (Array.isArray(data) && data[0].generated_text) return data[0].generated_text;
  if (data.generated_text) return data.generated_text;
  return JSON.stringify(data);
}

module.exports = { getHuggingFaceResponse };
