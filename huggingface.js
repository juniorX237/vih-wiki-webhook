const OpenAI = require('openai');

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

// Initialisation du client compatible OpenAI avec l'endpoint NVIDIA
const openai = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: NVIDIA_API_KEY
});

// Prompt système spécifique à JFI Express
const SYSTEM_PROMPT = `
Tu es l'assistant virtuel de JFI Express / Joe Air Cargo (Akwa, Douala).
Réponds de façon courtoise, claire et très concise (format WhatsApp/Messenger).

DONNÉES OFFICIELLES :
- Fret aérien ordinaire (7-10j) : 0,1-0,5kg (4000f), 0,6-1kg (7500f)
- Colis sensible (15-20j) : 0,1-1kg (9000f)
- Colis express (2-4j) : 0,1-1kg (11000f)
- Téléphones : transport temporairement suspendu
- Adresse Chine : 广州市越秀区环市中路怡东大厦一楼A31 (Joy 18027278910, Cindy 18027278991, Joe 13751709643)
- Marquage obligatoire : Pays, Ville, Nom, Téléphone du destinataire, nature de la marchandise

Si la question demande une intervention complexe ou si tu ne connais pas la réponse, indique poliment qu'un conseiller humain prend le relais.
`;

async function getNvidiaResponse(userQuery) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.1-70b-instruct', // Modèle performant disponible sur NVIDIA Build
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userQuery }
      ],
      temperature: 0.2,
      max_tokens: 300
    });

    const botResponse = completion.choices[0]?.message?.content;
    
    if (!botResponse) {
      throw new Error("Réponse vide de l'API NVIDIA");
    }

    return botResponse;

  } catch (error) {
    console.error('Erreur NVIDIA API:', error.message);
    throw error;
  }
}

// Export propre de la fonction
module.exports = { getNvidiaResponse };
