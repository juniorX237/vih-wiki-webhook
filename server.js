const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Route du webhook pour Dialogflow
app.get('/', (req, res) => {
  res.send('Webhook pour Dialogflow - Pas d\'interface graphique.');
});
app.post('/webhook', async (req, res) => {
  const question = req.body.queryResult?.queryText;

  if (!question) {
    return res.json({
      fulfillmentText: "❌ Je n'ai pas compris votre question. Pouvez-vous la reformuler ?"
    });
  }

  try {
    // Requête de recherche sur Wikipédia (fr)
    const searchResponse = await axios.get('https://fr.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: `${question} VIH`,
      }
    });

    const searchResults = searchResponse.data.query?.search;

    if (searchResults && searchResults.length > 0) {
      const pageId = searchResults[0].pageid;

      // Requête pour récupérer l'extrait de la page
      const contentResponse = await axios.get('https://fr.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          format: 'json',
          prop: 'extracts',
          pageids: pageId,
          exintro: true,
          explaintext: true // <- évite les balises HTML
        }
      });

      const page = contentResponse.data.query.pages[pageId];
      const extract = page.extract ? page.extract.substring(0, 500) + "..." : "Aucun contenu trouvé.";

      return res.json({
        fulfillmentText: `📌 Wikipédia : ${extract}`
      });

    } else {
      return res.json({
        fulfillmentText: "🔎 Je n'ai pas trouvé d'information fiable à ce sujet. Vous pouvez  essayer de reformuler ta question ou contacter un conseiller humain GTR-LITTORALE pour plus d'aide."
      });
    }

  } catch (error) {
    console.error("Erreur lors de l'accès à Wikipédia :", error.message);
    return res.json({
      fulfillmentText: "❗ Une erreur est survenue pendant la recherche. Merci de réessayer plus tard ou de reformuler votre question."
    });
  }
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur opérationnel sur http://localhost:${PORT}`));
