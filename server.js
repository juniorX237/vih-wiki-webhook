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
    {
      keywords: ['symptôme', 'symptomes', 'signes'],
      response: '🩺 Tu te poses des questions sur les symptômes ? La plupart des gens n’ont aucun signe au début. Mais parfois, on peut avoir de la fièvre, de la fatigue, ou des ganglions gonflés.'
    },
    {
      keywords: ['traitement', 'soigner', 'guérir'],
      response: '💊 Bonne nouvelle : il existe des traitements très efficaces ! Les ARV permettent de vivre normalement, d’avoir une famille, et de rester en bonne santé. Plus tôt on commence, mieux c’est.'
    },
    {
      keywords: ['transmission', 'transmet', 'contamination'],
      response: '🔁 Le VIH se transmet par : relations sexuelles sans préservatif, sang contaminé, ou de la mère à l’enfant. Il ne se transmet pas par les câlins, les moustiques ou en partageant la nourriture.'
    },
    {
      keywords: ['dépistage', 'test', 'diagnostic'],
      response: '🧪 Tu peux faire un test de dépistage gratuitement dans un hôpital public ou centre de santé. C’est rapide, confidentiel et ça sauve des vies. Fais-le même sans symptômes.'
    },
    {
      keywords: ['prévention', 'préservatif', 'protéger', 'éviter'],
      response: '🛡 Pour éviter le VIH : utilise toujours un préservatif, fais-toi dépister régulièrement, et informe-toi sur la PrEP (un traitement préventif). Tu as le droit de te protéger.'
    },
    {
      keywords: ['meurent', 'mort', 'décès'],
      response: '📊 Environ 630 000 personnes sont mortes du VIH en 2022. Mais ce nombre baisse grâce aux tests et aux traitements. Se faire dépister à temps sauve des vies!'
    },
    {
      keywords: ['premier pays', 'origine', 'apparu'],
      response: '🌍 Le VIH serait apparu en Afrique centrale (notamment au Cameroun et RDC), transmis à l\'homme par des singes. Il s\'est ensuite répandu à travers le monde.'
    },
    {
      keywords: ['qui a découvert', 'découvreur', 'découverte vih'],
      response: '🔬 Le VIH a été découvert en 1983 par l\'équipe de Luc Montagnier et Françoise Barré-Sinoussi à l\'Institut Pasteur, ce qui leur a valu le Prix Nobel de Médecine en 2008.'
    },
    {
      keywords: ['quelle année', 'date découverte', 'année découverte'],
      response: '📅 Le VIH a été découvert en 1983 par des chercheurs français de l\'Institut Pasteur.'
    },
    {
      keywords: [
        'pays avec le plus grand taux',
        'pays plus touchés',
        'taux contamination',
        'pays plus contaminés',
        'prévalence',
        'épidémie dans le monde'
      ],
      response: '🌍 Les pays avec le plus grand taux de contamination au VIH sont en Afrique australe : Eswatini, Lesotho, Botswana, Afrique du Sud et Zimbabwe. Dans ces pays, plus de 20% des adultes vivent avec le VIH. L\'Afrique subsaharienne reste la région la plus touchée au monde.'
    },
    {
      keywords: ['statistiques', 'taux', 'nombre de cas', 'combien de personnes', 'pourcentage'],
      response: '📊 En 2023, environ 39 millions de personnes vivent avec le VIH dans le monde. Plus des deux tiers des personnes concernées résident en Afrique subsaharienne.'
    },
    {
      keywords: [
        'vivre avec le vih',
        'peux je vivre avec le vih',
        'peut-on vivre avec le vih',
        'survivre au vih',
        'espérance de vie vih',
        'rester en vie avec le vih'
      ],
      response: '😊 Oui, il est tout à fait possible de vivre longtemps et en bonne santé avec le VIH ! Grâce aux traitements actuels (ARV), les personnes vivant avec le VIH peuvent avoir une vie normale, travailler, fonder une famille et réaliser leurs projets. Le plus important est de suivre son traitement et de faire un suivi médical régulier.'
    },
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

// Dictionnaire de simplification des termes médicaux
const SIMPLIFICATION_MAP = {
  "immunodéficience": "affaiblissement des défenses immunitaires",
  "système immunitaire": "défenses naturelles du corps",
  "lymphocytes": "cellules de défense",
  "antirétroviraux": "médicaments contre le VIH",
  "séropositif": "porteur du VIH",
  "épidémiologie": "étude des maladies",
  "pathogène": "microbe dangereux",
  "rétrovirus": "virus particulier",
  "contamination": "transmission",
  "asymptomatique": "sans symptômes",
  "opportuniste": "qui profite de la faiblesse",
  "pandémie": "maladie mondiale",
  "prévalence": "nombre de cas",
  "transmission": "contagion",
  "diagnostic": "dépistage",
  "virologie": "étude des virus",
  "sérologique": "par prise de sang"
};

// Fonctions utilitaires
const cleanText = (text) => 
  text.replace(/&nbsp;|\[\s*\d+\s*\]|\[[a-z]\]/gi, ' ')
     .replace(/\s+/g, ' ')
     .trim();

// Simplifie le texte médical pour le grand public
function simplifyMedicalText(text) {
  let simplified = text;
  for (const [term, replacement] of Object.entries(SIMPLIFICATION_MAP)) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    simplified = simplified.replace(regex, replacement);
  }
  return simplified;
}

// Formate le texte pour Dialogflow (listes, paragraphes)
function formatResponse(text) {
  // Détecte les listes naturelles dans le texte
  const listRegex = /(?:-|•|\d+\.)\s*(.+?)(?=\n|$)/g;
  let formatted = text;
  
  // Remplace les listes détectées par un format plus clair
  formatted = formatted.replace(listRegex, '- $1\n');
  
  // Ajoute des sauts de ligne après les points
  formatted = formatted.replace(/\.\s+/g, '.\n\n');
  
  // Limite la longueur des paragraphes
  return formatted.substring(0, 1500);
}

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
    )) || sections[0];

  // 4. Récupération du contenu
  const contentData = await fetchWikipediaData({
    action: 'parse',
    pageid: pageId,
    prop: 'text',
    section: relevantSection?.index
  });

  const html = contentData?.parse?.text['*'];
  if (!html) return null;
  
  // Conversion HTML en texte brut
  const rawText = html.replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim();
  
  // Nettoyage et simplification
  return simplifyMedicalText(cleanText(rawText));
}

async function generateSummary(text) {
  try {
    if (!text || text.length < 100) return text;
    
    // Crée un résumé avec la bibliothèque
    const summarizer = new SummarizerManager(text, 3);
    const { summary } = await summarizer.getSummaryByRank();
    
    // Simplification supplémentaire
    return simplifyMedicalText(summary);
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
      const formattedSummary = formatResponse(summary);
      
      return res.json({
        fulfillmentText: `📚 Voici ce que j'ai trouvé :\n\n${formattedSummary}\n\n💡 Pour un diagnostic précis, consultez un professionnel de santé.`
      });
    }
  } catch (error) {
    console.error('Erreur Wikipedia:', error);
  }

  // 4. Réponse par défaut
  return res.json({ fulfillmentText: DEFAULT_RESPONSE });
});

// Démarrer le serveur
app.listen(PORT, () => 
  console.log(`✅ Serveur en écoute sur le port ${PORT}`)
);
