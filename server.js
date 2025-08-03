const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Dictionnaire de réponses de secours
const VIH_KNOWLEDGE = {
  'symptômes': 'Principaux symptômes du VIH : fièvre, fatigue, gonflement des ganglions. Mais beaucoup de personnes n\'ont aucun symptôme au début.',
  'traitement': 'Les traitements antirétroviraux (ARV) permettent de vivre normalement avec le VIH et de ne plus transmettre le virus si la charge virale est indétectable.',
  'transmission': 'Le VIH se transmet par : relations sexuelles non protégées, sang contaminé, mère-enfant pendant la grossesse ou l\'allaitement.',
  'dépistage': 'Le test de dépistage est simple (prise de sang ou test rapide). En cas de risque, faites un test immédiatement et à 6 semaines.',
  'prévention': 'Moyens de prévention : préservatifs, PrEP (traitement préventif), matériel stérile pour injections, dépistage régulier.'
};

app.post('/webhook', async (req, res) => {
  const question = req.body.queryResult?.queryText?.toLowerCase() || '';
  
  // Vérification que la question concerne bien le VIH
  if (!question.includes('vih') && !question.includes('sida')) {
    return res.json({
      fulfillmentText: "❌ Je ne réponds qu'aux questions sur le VIH/sida. Posez-moi une question comme : 'Quels sont les symptômes du VIH ?' ou 'Comment se transmet le sida ?'"
    });
  }

  try {
    // 1. Essayer d'abord avec nos réponses contrôlées
    for (const [keyword, response] of Object.entries(VIH_KNOWLEDGE)) {
      if (question.includes(keyword)) {
        return res.json({
          fulfillmentText: `📌 ${response}`
        });
      }
    }

    // 2. Si pas de réponse prévue, chercher sur Wikipédia
    const searchResponse = await axios.get('https://fr.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: `VIH ${question}`,
        srlimit: 1
      }
    });

    const searchResults = searchResponse.data.query?.search;
    
    if (searchResults && searchResults.length > 0) {
      const pageId = searchResults[0].pageid;
      const contentResponse = await axios.get('https://fr.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          format: 'json',
          prop: 'extracts',
          pageids: pageId,
          exintro: true,
          explaintext: true,
          exsentences: 3
        }
      });

      const page = contentResponse.data.query.pages[pageId];
      let extract = page.extract || VIH_KNOWLEDGE['dépistage']; // Fallback

      // Nettoyage de la réponse
      extract = extract.replace(/\[\d+\]/g, '')
                      .replace(/\n/g, ' ')
                      .substring(0, 300);

      return res.json({
        fulfillmentText: `ℹ️ D'après Wikipédia : ${extract}...\n\n💡 Conseil : Pour une information personnalisée, consultez un professionnel de santé.`
      });
    }

  } catch (error) {
    console.error("Erreur API :", error);
  }

  // 3. Si tout échoue, utiliser une réponse générique
  return res.json({
    fulfillmentText: "Je n'ai pas trouvé de réponse précise à votre question. Voici ce que je sais sur le VIH :\n\n" +
                    "- Transmission : relations sexuelles non protégées, sang contaminé\n" +
                    "- Traitement : ARV très efficaces disponibles\n" +
                    "- Prévention : préservatifs, PrEP, matériel stérile"
  });
});

app.listen(3000, () => console.log('✅ Server ready'));
