const express = require('express');
const axios = require('axios');
const { SummarizerManager } = require('node-summarizer');
const app = express();

app.use(express.json());

const VIH_KNOWLEDGE = [
  {
    keywords: ['symptôme', 'symptomes', 'signes'],
    response: '🩺 Tu te poses des questions sur les symptômes ? La plupart des gens n’ont aucun signe au début. Mais parfois, on peut avoir de la fièvre, de la fatigue, ou des ganglions gonflés. Le seul moyen d’en être sûr, c’est de faire un test.\n\nℹ Au Cameroun, tu peux te faire dépister gratuitement via la CSU. Renseigne-toi à l’hôpital public le plus proche.'
  },
  {
    keywords: ['traitement', 'soigner', 'guérir'],
    response: '💊 Bonne nouvelle : il existe des traitements très efficaces ! Les ARV permettent de vivre normalement, d’avoir une famille, et de rester en bonne santé. Plus tôt on commence, mieux c’est.\n\nℹ Au Cameroun, tu peux te faire soigner gratuitement via la CSU. Renseigne-toi à l’hôpital public le plus proche.'
  },
  {
    keywords: ['transmission', 'transmet', 'contamination'],
    response: '🔁 Le VIH se transmet par : relations sexuelles sans préservatif, sang contaminé, ou de la mère à l’enfant. Il ne se transmet pas par les câlins, les moustiques ou en partageant la nourriture.'
  },
  {
    keywords: ['dépistage', 'test', 'diagnostic'],
    response: '🧪 Tu peux faire un test de dépistage gratuitement dans un hôpital public ou centre de santé. C’est rapide, confidentiel et ça sauve des vies. Fais-le même sans symptômes.\n\nℹ Demande à être enrôlé à la CSU si ce n’est pas encore fait.'
  },
  {
    keywords: ['prévention', 'préservatif', 'protéger', 'éviter'],
    response: '🛡 Pour éviter le VIH : utilise toujours un préservatif, fais-toi dépister régulièrement, et informe-toi sur la PrEP (un traitement préventif). Tu as le droit de te protéger.'
  },
  {
    keywords: ['meurent', 'mort', 'décès'],
    response: '📊 Environ 630 000 personnes sont mortes du VIH en 2022. Mais ce nombre baisse grâce aux tests et aux traitements. Se faire dépister à temps sauve des vies !'
  },
  {
    keywords: ['premier pays', 'origine', 'apparu'],
    response: '🌍 Le VIH serait apparu en Afrique centrale (notamment au Cameroun et RDC), transmis à l’homme par des singes. Il s’est ensuite répandu à travers le monde.'
  }
];
// Fonction utilitaire pour récupérer une section pertinente de Wikipédia
async function getWikiSection(question) {
  // Recherche de la page liée au VIH et à la question
  const searchResp = await axios.get('https://fr.wikipedia.org/w/api.php', {
    params: {
      action: 'query',
      format: 'json',
      list: 'search',
      srsearch: `VIH ${question}`,
      srlimit: 1,
    }
  });
  const pageId = searchResp.data.query.search?.[0]?.pageid;
  if (!pageId) return null;

  // Récupération des sections de la page trouvée
  const sectionsResp = await axios.get('https://fr.wikipedia.org/w/api.php', {
    params: {
      action: 'parse',
      format: 'json',
      pageid: pageId,
      prop: 'sections',
    }
  });
  const sections = sectionsResp.data.parse?.sections || [];
  // Choix de la section la plus pertinente
  const keywords = ['symptôme', 'traitement', 'transmission', 'prévention', 'dépistage', 'origine'];
  let section = sections.find(s => keywords.some(k => question.includes(k) && s.line.toLowerCase().includes(k)));
  if (!section) section = sections[0]; // sinon la première section

  // Récupération du contenu brut de la section
  const sectionNumber = section?.index;
  const contentResp = await axios.get('https://fr.wikipedia.org/w/api.php', {
    params: {
      action: 'parse',
      format: 'json',
      pageid: pageId,
      prop: 'text',
      section: sectionNumber,
    }
  });
  const html = contentResp.data.parse?.text['*'];
  if (!html) return null;
  // Suppression du HTML
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text;
}

// Fonction résumé local
async function summarizeText(text) {
  if (!text || text.length < 100) return text; // Pas assez de texte pour résumer
  const summarizer = new SummarizerManager(text, 3); // Résumé 3 phrases max
  const summary = await summarizer.getSummaryByRank();
  return summary.summary;
}

app.post('/webhook', async (req, res) => {
  const question = req.body.queryResult?.queryText?.toLowerCase() || '';

  // Blocage des questions hors sujet
  if (!question.includes('vih') && !question.includes('sida')) {
    return res.json({
      fulfillmentText: "❌ Je réponds uniquement aux questions sur le VIH/sida. Exemple : 'Comment se transmet le VIH ?'"
    });
  }

  // CSU
  if (question.includes('csu') || question.includes('couverture santé') || question.includes('santé universelle')) {
    return res.json({
      fulfillmentText: "📘 La Couverture Santé Universelle (CSU) permet aux personnes vivant au Cameroun d’accéder à certains soins gratuitement ou à faible coût.\n\n👥 Pour en bénéficier, rends-toi dans un hôpital public avec ta carte d’identité."
    });
  }

  // Base de connaissance locale
  for (const item of VIH_KNOWLEDGE) {
    if (item.keywords.some(word => question.includes(word))) {
      return res.json({ fulfillmentText: item.response });
    }
  }

  // Fallback Wikipédia amélioré
  try {
    const sectionText = await getWikiSection(question);
    if (sectionText) {
      const summary = await summarizeText(sectionText);
      return res.json({
        fulfillmentText: `ℹ Voici ce que j’ai trouvé :\n\n"${summary}"\n\n💡 Pour un accompagnement, consulte un professionnel ou rends-toi dans un hôpital public.`
      });
    }
  } catch (error) {
    console.error('Erreur Wikipedia :', error?.message || error);
  }

  // Dernier recours
  return res.json({
    fulfillmentText:
      "Je n'ai pas trouvé une réponse précise, mais voici les bases :\n\n" +
      "- 📌 Transmission : rapports sexuels non protégés, sang contaminé\n" +
      "- 💊 Traitement : ARV très efficaces\n" +
      "- 🛡 Prévention : préservatifs, PrEP, test régulier"
  });
});

app.listen(3000, () => console.log('✅ Serveur en ligne sur le port 3000'));
