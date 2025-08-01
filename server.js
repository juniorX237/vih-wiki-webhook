const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

app.post("/webhook", async (req, res) => {
  const sujet = req.body.queryResult.parameters["sujet"] || "VIH";
  const url = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sujet)}`;

  try {
    const response = await axios.get(url);
    const extrait = response.data.extract;
    const titre = response.data.title;

    const message = `🧬 *${titre}* :\n${extrait}\n\nTu peux me poser une autre question si tu veux 😊`;

    res.json({ fulfillmentText: message });
  } catch (error) {
    res.json({ fulfillmentText: "Désolé 😕, je n’ai pas trouvé d’informations sur ce sujet. Essaie de reformuler ta question." });
  }
});

app.get("/", (req, res) => {
  res.send("Le Webhook Wikipédia VIH est actif ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));