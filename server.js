const { getNvidiaResponse } = require('./huggingface'); 

// Dans ta route /webhook :
app.post('/webhook', async (req, res) => {
  const userQuery = req.body.queryResult?.queryText || '';

  try {
    const aiReply = await getNvidiaResponse(userQuery);
    return res.json({ fulfillmentText: aiReply });
  } catch (error) {
    return res.json({ 
      fulfillmentText: "Un conseiller humain va prendre le relais pour vous répondre. Merci de patienter !" 
    });
  }
});
