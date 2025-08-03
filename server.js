const express = require('express');
const axios = require('axios');
const { SummarizerManager } = require('node-summarizer');
const app = express();

app.use(express.json());

const VIH_KNOWLEDGE = [
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
    response: '📊 Environ 630 000 personnes sont mortes du VIH en 2022. Mais ce nombre baisse grâce aux tests et aux traitements. Se faire dépister à temps sauve des vies !'
  },
  {
    keywords: ['premier pays', 'origine', 'apparu'],
    response: '🌍 Le VIH serait apparu en Afrique centrale (notamment au Cameroun et RDC), transmis à l’homme par des singes. Il s’est ensuite répandu à travers le monde.'
  },
  // Découverte du VIH
  {
    keywords: ['qui a découvert', 'découvreur', 'découverte vih'],
    response: '🔬 Le VIH a été découvert en 1983 par l’équipe de Luc Montagnier et Françoise Barré-Sinoussi à l’Institut Pasteur, ce qui leur a valu le Prix Nobel de Médecine en 2008.'
  },
  {
    keywords: ['quelle année', 'date découverte', 'année découverte'],
    response: '📅 Le VIH a été découvert en 1983 par des chercheurs français de l’Institut Pasteur.'
  },
  // Statistiques, taux, prévalence, pays les plus touchés
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
  // Vie avec le VIH
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
  // Tabous sur le VIH
  {
    keywords: [
      'question tabou', 
      'tabous', 
      'sujet tabou', 
      'questions gênantes', 
      'questions sensibles', 
      'peut-on en parler', 
      'parler du vih', 
      'honte', 
      'jugement', 
      'discrimination'
    ],
    response: '🤫 Beaucoup de personnes hésitent à parler du VIH à cause des tabous, de la honte ou de la peur du jugement. Pourtant, parler du VIH avec un professionnel de santé ou une personne de confiance aide à mieux se protéger et à vivre sereinement. Le VIH n’est pas une honte : c’est une maladie chronique comme une autre. L’information et le dialogue sont essentiels pour lutter contre la stigmatisation.'
  },
  // Différence VIH / SIDA
  {
    keywords: [
      'différence vih et sida',
      'différence entre vih et sida',
      'vih ou sida',
      'vih sida',
      "c'est quoi le sida",
      "c'est quoi le vih",
      'différence sida vih',
      'quelle différence vih et sida'
    ],
    response: '🧬 Le VIH est un virus qui attaque le système immunitaire. Si on ne le traite pas, il peut évoluer vers le SIDA. Le SIDA (Syndrome d’ImmunoDéficience Acquise) est le stade avancé de l’infection par le VIH, quand les défenses naturelles du corps sont très affaiblies. Grâce aux traitements, la plupart des personnes vivant avec le VIH ne développent jamais le SIDA.'
  }
];

// Nettoie le texte Wikipédia des caractères bizarres (HTML, [9], etc.)
function cleanWikiText(text) {
  let clean = text.replace(/&nbsp;/g, ' ');
  clean = clean.replace(/\[\s*\d+\s*\]/g, '');
  clean = clean.replace(/\[[a-z]\]/gi, '');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

async function getWikiSection(question) {
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

  const sectionsResp = await axios.get('https://fr.wikipedia.org/w/api.php', {
    params: {
      action: 'parse',
      format: 'json',
      pageid: pageId,
      prop: 'sections',
    }
  });
  const sections = sectionsResp.data.parse?.sections || [];
  const keywords = [
    'symptôme', 'traitement', 'transmission', 'prévention', 'dépistage', 'origine', 'découverte', 'histoire', 'épidémiologie', 'statistique', 'prévalence'
  ];
  let section = sections.find(s => keywords.some(k => question.includes(k) && s.line.toLowerCase().includes(k)));
  if (!section) section = sections[0];

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
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text;
}

async function summarizeText(text) {
  if (!text || text.length < 100) return text;
  const summarizer = new SummarizerManager(text, 3);
  const summary = await summarizer.getSummaryByRank();
  return summary.summary;
}

app.post('/webhook', async (req, res) => {
  const question = req.body.queryResult?.queryText?.toLowerCase() || '';

  if (!question.includes('vih') && !question.includes('sida')) {
    return res.json({
      fulfillmentText: "❌ Je réponds uniquement aux questions sur le VIH/sida. Exemple : 'Comment se transmet le VIH ?'"
    });
  }

  if (question.includes('csu') || question.includes('couverture santé') || question.includes('santé universelle')) {
    return res.json({
      fulfillmentText: "📘 La Couverture Santé Universelle (CSU) permet aux personnes vivant au Cameroun d’accéder à certains soins gratuitement ou à faible coût.\n\n👥 Pour en bénéficier, il suffit de s’inscrire dans un centre de santé agréé. Munis-toi de ta carte d’identité et demande des informations à l’accueil."
    });
  }

  for (const item of VIH_KNOWLEDGE) {
    if (item.keywords.some(word => question.includes(word))) {
      return res.json({ fulfillmentText: item.response });
    }
  }

  try {
    const sectionText = await getWikiSection(question);
    if (sectionText) {
      const summary = await summarizeText(sectionText);
      const summaryClean = cleanWikiText(summary);
      return res.json({
        fulfillmentText: `ℹ Voici ce que j’ai trouvé :\n\n"${summaryClean}"\n\n💡 Pour un accompagnement, consulte un professionnel ou rends-toi dans un hôpital public.`
      });
    }
  } catch (error) {
    console.error('Erreur Wikipedia :', error?.message || error);
  }

  return res.json({
    fulfillmentText:
      "Je n'ai pas trouvé une réponse précise, mais voici les bases :\n\n" +
      "- 📌 Transmission : rapports sexuels non protégés, sang contaminé\n" +
      "- 💊 Traitement : ARV très efficaces\n" +
      "- 🛡 Prévention : préservatifs, PrEP, test régulier"
  });
});

app.listen(3000, () => console.log('✅ Serveur en ligne sur le port 3000'));
