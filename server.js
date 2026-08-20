require('dotenv').config();
const express = require('express');
const { getNvidiaResponse } = require('./nvidiaService'); // Ajustez le nom du fichier si nécessaire

const app = express(); // <-- C'est cette ligne qui manquait !
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Route de vérification (pour tester si le serveur tourne)
app.get('/', (req, res) => {
  res.send('Serveur JFI Express opérationnel !');
});

// Route Webhook pour Dialogflow / Messenger / WhatsApp
app.post('/webhook', async (req, res) => {
  const userQuery = req.body.queryResult?.queryText || '';

  try {
    const aiReply = await getNvidiaResponse(userQuery);
    return res.json({ fulfillmentText: aiReply });
  } catch (error) {
    console.error('Erreur traitement Webhook:', error.message);
    return res.json({
      fulfillmentText: "Un conseiller humain va prendre le relais pour vous répondre. Merci de patienter !"
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur JFI Express en écoute sur le port ${PORT}`);
});
