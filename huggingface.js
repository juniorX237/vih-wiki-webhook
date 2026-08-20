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
Tu réponds aux clients en français, de manière courtoise, claire et très concise (format WhatsApp/Messenger).

RÈGLES DE CONVERSATION :
- Ne dis "Bonjour" ou "Salut" QU'UNE SEULE FOIS en début de conversation. Ne le répète pas dans les messages suivants.

DONNÉES OFFICIELLES :
- Fret aérien ordinaire (7-10j) : 0,1-0,5kg (4000f), 0,6-1kg (7500f)
- Colis sensible (15-20j) : 0,1-1kg (9000f)
- Colis express (2-4j) : 0,1-1kg (11000f)
- Téléphones : transport temporairement suspendu
- Adresse Chine : 广州市越秀区环市中路怡东大厦一楼A31 (Joy 18027278910, Cindy 18027278991, Joe 13751709643)
- Marquage obligatoire : Pays, Ville, Nom, Téléphone du destinataire, nature de la marchandise

GESTION DES RÉCLAMATIONS ET SUIVI DE COLIS :
- Si le client signale un problème (retard, dommage, perte, suivi de colis) :
  1. Si le numéro de colis n'est pas fourni, demande-lui son numéro de colis/reçu.
  2. Dès qu'il fournit son numéro de colis, confirme sa prise en compte et demande-lui son Nom et Téléphone pour qu'un agent le recontacte.
  3. Indique clairement qu'un conseiller humain prend en charge son dossier.
`;

async function getNvidiaResponse(userQuery) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-oss-20b', // Modèle performant disponible sur NVIDIA Build
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
