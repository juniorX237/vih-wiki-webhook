require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/**
 * VÉRIFICATION DES HORAIRES D'OUVERTURE
 * Lundi à Samedi : 08h00 - 17h30 (Heure du Cameroun / GMT+1)
 */
function isBusinessHours() {
  const now = new Date();
  
  const options = { 
    timeZone: 'Africa/Douala', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false, 
    weekday: 'short' 
  };
  
  const formatter = new Intl.DateTimeFormat('fr-FR', options);
  const parts = formatter.formatToParts(now);

  let hour = 0, minute = 0, weekday = '';
  parts.forEach(p => {
    if (p.type === 'hour') hour = parseInt(p.value, 10);
    if (p.type === 'minute') minute = parseInt(p.value, 10);
    if (p.type === 'weekday') weekday = p.value.toLowerCase();
  });

  const currentMinutes = hour * 60 + minute;
  const openTime = 8 * 60;           // 08h00
  const closeTime = 17 * 60 + 30;    // 17h30

  const isWorkDay = !weekday.startsWith('dim'); // Fermé le dimanche
  const isOpenHours = currentMinutes >= openTime && currentMinutes <= closeTime;

  return isWorkDay && isOpenHours;
}

/**
 * ROUTE WEBHOOK DIALOGFLOW
 */
app.post('/webhook', (req, res) => {
  const queryResult = req.body.queryResult || {};
  const intentName = queryResult.intent?.displayName || '';

  // --- OPTION 4 : PARLER À UN AGENT / SERVICE CLIENT ---
  if (intentName === 'Demande_Agent_Humain' || intentName === 'Option_4') {
    if (isBusinessHours()) {
      return res.json({
        fulfillmentText: "👨‍💼 *Service Client JFI Express / Joe Air Cargo*\n\nNous sommes actuellement ouverts ! Un membre de notre équipe va traiter votre demande et vous recontacter dans les plus brefs délais entre 8h et 17h30.\n\n📌 Merci de nous laisser votre **Nom**, **Numéro WhatsApp** et votre **Numéro de colis** (si concerné)."
      });
    } else {
      return res.json({
        fulfillmentText: "🌙 *Bureaux actuellement fermés*\n\nNos locaux d'Akwa sont fermés pour la journée (Horaires : **Lundi - Samedi, 8h00 à 17h30**).\n\nVeuillez nous laisser votre **Nom**, **Téléphone** et votre **demande**. Un membre du service client vous recontactera dès l'ouverture à 8h00 !"
      });
    }
  }

  // --- OPTION 3 : SUIVI DE COLIS ---
  if (intentName === 'Suivi_Colis' || intentName === 'Option_3') {
    if (isBusinessHours()) {
      return res.json({
        fulfillmentText: "📦 *Suivi de Colis JFI Express*\n\nUn agent du service client va vérifier l'état de votre expédition entre 8h et 17h30.\n\nVeuillez nous transmettre votre **Numéro de bordereau/colis**, votre **Nom** et votre **Téléphone**."
      });
    } else {
      return res.json({
        fulfillmentText: "📦 *Suivi de Colis JFI Express*\n\nNos bureaux sont actuellement fermés. Laissez-nous votre **Numéro de colis** ainsi que votre **Nom** et **Téléphone**, notre équipe vérifiera votre dossier dès 8h00."
      });
    }
  }

  // --- FALLBACK (Si l'intent n'est pas reconnu) ---
  if (isBusinessHours()) {
    return res.json({
      fulfillmentText: "Un membre du service client a bien reçu votre message. Laissez-nous votre demande avec votre **Nom** et **Téléphone**, nous vous recontactons très rapidement !"
    });
  } else {
    return res.json({
      fulfillmentText: "Nos bureaux sont actuellement fermés (Ouverture à 8h00). Laissez votre **Nom** et **Numéro de téléphone**, un conseiller vous recontactera dans les plus brefs délais."
    });
  }
});

// Route de test
app.get('/', (req, res) => {
  res.send('Serveur Webhook JFI Express (Sans IA) Opérationnel !');
});

app.listen(PORT, () => {
  console.log(`✅ Serveur JFI Express démarré sur le port ${PORT}`);
});
