const express = require('express');
const bodyParser = require('body-parser');
const { getHuggingFaceResponse } = require('./huggingface');

const app = express();
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  try {
    const userText = req.body.queryResult.queryText;
    // Pour spécialiser la réponse
    const prompt = `En tant qu'expert du VIH et de la CSU, réponds à : ${userText}`;
    const hfResponse = await getHuggingFaceResponse(prompt);

    res.json({
      fulfillmentText: hfResponse
    });
  } catch (error) {
    console.error(error);
    res.json({
      fulfillmentText: "Désolé, une erreur est survenue. Merci de réessayer."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
