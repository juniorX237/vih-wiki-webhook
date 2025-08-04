const express = require('express');
const axios = require('axios');
const { SummarizerManager } = require('node-summarizer');
const app = express();

app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3000;
const WIKIPEDIA_API = 'https://fr.wikipedia.org/w/api.php';
const DEFAULT_RESPONSE = "Je n'ai pas trouvé de réponse précise. Voici les bases sur le VIH :\n\n- Transmission : rapports non protégés, sang contaminé\n- Traitement : ARV efficaces\n- Prévention : préservatifs, dépistage";

// Base de connaissances enrichie
const KNOWLEDGE_BASE = {
  vih: [
    // ... (vos réponses existantes)
    {
      keywords: ['salut', 'bonjour', 'coucou', 'hello'],
      response: '👋 Bonjour ! Je suis un assistant spécialisé sur le VIH et la CSU. Posez-moi vos questions comme : "Comment se transmet le VIH ?" ou "Quels sont les symptômes ?"'
    },
    {
      keywords: ['ça va', 'comment vas-tu', 'tu vas bien'],
      response: '🤖 Je suis un robot, donc toujours en forme ! Merci de demander 😊 Comment puis-je vous aider sur le VIH ou la CSU aujourd\'hui ?'
    }
  ],
  csu: [
    {
      keywords: ['csu', 'couverture santé', 'santé universelle'],
      response: '📘 La CSU permet aux Camerounais d\'accéder à des soins à faible coût. Pour bénéficier :\n1. Rendez-vous dans un centre de santé agréé\n2. Munissez-vous de votre CNI\n3. Demandez les informations à l\'accueil'
    }
  ]
};

// Fonctions utilitaires
const cleanText = (text) => 
  text.replace(/&nbsp;|\[\s*\d+\s*\]|\[[a-z]\]/gi, ' ')
     .replace(/\s+/g, ' ')
     .trim();

async function fetchWikipediaData(params) {
  try {
    const { data } = await axios.get(WIKIPEDIA_API, { 
      params: { ...params, format: 'json' },
      timeout: 5000
    });
    return data;
  } catch (error) {
    console.error('Erreur Wikipedia API:', error.message);
    return null;
  }
}

async function getWikiResponse(question) {
  // 1. Recherche de page
  const searchData = await fetchWikipediaData({
    action: 'query',
    list: 'search',
    srsearch: `VIH ${question}`,
    srlimit: 1
  });
  
  const pageId = searchData?.query?.search?.[0]?.pageid;
  if (!pageId) return null;

  // 2. Récupération des sections
  const sectionsData = await fetchWikipediaData({
    action: 'parse',
    pageid: pageId,
    prop: 'sections'
  });

  const sections = sectionsData?.parse?.sections || [];
  
  // 3. Sélection de section pertinente
  const relevantSection = sections.find(section => 
    question.split(' ').some(word => 
      section.line.toLowerCase().includes(word.toLowerCase())
    ) || sections[0];

  // 4. Récupération du contenu
  const contentData = await fetchWikipediaData({
    action: 'parse',
    pageid: pageId,
    prop: 'text',
    section: relevantSection?.index
  });

  const html = contentData?.parse?.text['*'];
  return html ? cleanText(html.replace(/<[^>]+>/g, ' ')) : null;
}

async function generateSummary(text) {
  try {
    if (!text || text.length < 100) return text;
    const summarizer = new SummarizerManager(text, 3);
    const { summary } = await summarizer.getSummaryByRank();
    return summary;
  } catch (error) {
    console.error('Erreur de résumé:', error);
    return text.substring(0, 500) + '...';
  }
}

// Gestion des requêtes
app.post('/webhook', async (req, res) => {
  const query = req.body.queryResult?.queryText?.toLowerCase() || '';
  
  // 1. Vérification du sujet
  if (!query.match(/\b(vih|sida|csu|santé universelle)\b/i)) {
    return res.json({
      fulfillmentText: "🔍 Je suis spécialisé sur le VIH et la CSU. Posez-moi des questions comme :\n\"Comment se transmet le VIH ?\"\n\"Comment bénéficier de la CSU ?\""
    });
  }

  // 2. Réponses prédéfinies
  const allResponses = [...KNOWLEDGE_BASE.vih, ...KNOWLEDGE_BASE.csu];
  const matchedResponse = allResponses.find(item => 
    item.keywords.some(keyword => query.includes(keyword))
  );

  if (matchedResponse) {
    return res.json({ fulfillmentText: matchedResponse.response });
  }

  // 3. Recherche Wikipedia
  try {
    const wikiText = await getWikiResponse(query);
    if (wikiText) {
      const summary = await generateSummary(wikiText);
      return res.json({
        fulfillmentText: `📚 Voici ce que j'ai trouvé :\n\n${cleanText(summary)}\n\n💡 Pour plus de détails, consultez un professionnel de santé.`
      });
    }
  } catch (error) {
    console.error('Erreur:', error);
  }

  // 4. Réponse par défaut
  return res.json({ fulfillmentText: DEFAULT_RESPONSE });
});

// Démarrer le serveur
app.listen(PORT, () => 
  console.log(`✅ Serveur en écoute sur le port ${PORT}`)
);
