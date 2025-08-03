const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Amélioration 1 : Cache simple pour éviter les requêtes répétées
const responseCache = new Map();

// Amélioration 2 : Liste de mots-clés VIH pour le filtrage
const VIH_KEYWORDS = ['vih', 'sida', 'virus immunodéficience', 'arv', 'prép', 'tarv'];

// Route principale
app.get('/', (req, res) => {
  res.send('Service webhook pour le chatbot VIH');
});

// Route du webhook
app.post('/webhook', async (req, res) => {
  const question = req.body.queryResult?.queryText?.toLowerCase();

  if (!question) {
    return sendError(res, "Je n'ai pas compris votre question. Pouvez-vous reformuler ?");
  }

  // Amélioration 3 : Vérification du sujet VIH
  if (!VIH_KEYWORDS.some(keyword => question.includes(keyword))) {
    return sendError(res, "Je ne réponds qu'aux questions sur le VIH/sida. Voici quelques sujets que je peux aborder : symptômes, traitement, prévention...");
  }

  // Amélioration 4 : Utilisation du cache
  const cachedResponse = responseCache.get(question);
  if (cachedResponse) {
    return res.json(cachedResponse);
  }

  try {
    // Amélioration 5 : Recherche plus précise
    const searchResponse = await axios.get('https://fr.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: `intitle:${question} VIH OR SIDA`,
        srlimit: 1
      }
    });

    const searchResults = searchResponse.data.query?.search;

    if (!searchResults || searchResults.length === 0) {
      return sendError(res, "Je n'ai pas trouvé d'information précise sur ce sujet. Voici ce que je sais sur le VIH : [résumé basique]");
    }

    const pageId = searchResults[0].pageid;
    const contentResponse = await axios.get('https://fr.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        format: 'json',
        prop: 'extracts',
        pageids: pageId,
        exintro: true,
        explaintext: true,
        exsentences: 3 // Limite à 3 phrases pour plus de concision
      }
    });

    const page = contentResponse.data.query.pages[pageId];
    let extract = page.extract || "Aucun contenu trouvé.";

    // Amélioration 6 : Nettoyage et formatage
    extract = cleanWikipediaResponse(extract);
    
    const response = {
      fulfillmentText: formatResponse(question, extract),
      source: 'Wikipédia'
    };

    // Mise en cache
    responseCache.set(question, response);
    
    return res.json(response);

  } catch (error) {
    console.error("Erreur API Wikipédia:", error);
    return sendError(res, "Désolé, je rencontre des difficultés techniques. Vous pouvez essayer de reformuler ou contacter un centre de santé.");
  }
});

// Fonctions utilitaires améliorées
function cleanWikipediaResponse(text) {
  // Supprime les références [1], [2], etc.
  return text.replace(/\[\d+\]/g, '')
             .replace(/\n/g, ' ')
             .trim();
}

function formatResponse(question, extract) {
  const responses = {
    'symptômes': `ℹ️ Symptômes du VIH : ${extract}\n\n⚠️ Si vous pensez avoir été exposé, faites un test de dépistage.`,
    'traitement': `💊 Traitements du VIH : ${extract}\n\nLes ARV permettent aujourd'hui de vivre normalement avec le VIH.`,
    'prévention': `🛡️ Prévention du VIH : ${extract}\n\nN'oubliez pas : préservatifs, PrEP et matériel stérile.`
  };

  // Trouve la réponse la plus pertinente
  for (const [key, value] of Object.entries(responses)) {
    if (question.includes(key)) {
      return value;
    }
  }

  // Réponse par défaut
  return `📌 Selon Wikipédia : ${extract}\n\n(Source fiable mais consultez un professionnel pour des conseils personnels)`;
}

function sendError(res, message) {
  return res.json({
    fulfillmentText: `❌ ${message}`,
    source: 'Système'
  });
}

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur opérationnel sur le port ${PORT}`));
