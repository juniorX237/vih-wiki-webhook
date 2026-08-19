import express from 'express';
import OpenAI from 'openai';

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

app.post('/webhook', async (req, res) => {
  const userQuery = req.body.queryResult?.queryText || '';

  try {
    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.1-70b-instruct",
      messages: [
        { 
          role: "system", 
          content: "Tu es l'assistant virtuel de JFI Express / Joe Air Cargo (Akwa, Douala).Tu réponds aux clients en français, de manière concise et courtoise.INFORMATIONS OFFICIELLES :- Fret aérien colis ordinaire (7-10j) : 0,1-0,5kg (4000f), 0,6-1kg (7500f).- Colis sensible (15-20j) : 0,1-1kg (9000f).- Colis express (2-4j) : 0,1-1kg (11000f).- Téléphones : transport momentanément suspendu.- Adresse Chine : 广州市越秀区环市中路怡东大厦一楼A31 (Joy 18027278910, Cindy 18027278991, Joe 13751709643).- Marquage obligatoire : Pays, Ville, Nom, Téléphone du destinataire, nature de la marchandise.- Horaires service client : Lundi au Samedi, 8h00 à 17h30.Si une demande est complexe ou hors sujet, indique qu'un conseiller humain prendra le relais." 
        },
        { role: "user", content: userQuery }
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const reply = completion.choices[0].message.content;
    return res.json({ fulfillmentText: reply });

  } catch (error) {
    console.error("Erreur API NVIDIA:", error);
    return res.json({ 
      fulfillmentText: "Un conseiller humain prend en charge votre demande." 
    });
  }
});

app.listen(3000, () => console.log('Serveur actif sur le port 3000'));
