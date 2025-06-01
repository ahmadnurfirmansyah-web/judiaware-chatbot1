require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); // node 18+

const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});

app.use(cors());
app.use(express.json());

// 1️.Rute: Mood Check (Sentiment Analysis)
app.post('/mood-check', async (req, res) => {
  const userText = req.body.text;

  const sentimentUrl = `${process.env.AZURE_TEXT_ENDPOINT}/text/analytics/v3.1/sentiment`;

  const payload = {
    documents: [
      {
        id: "1",
        language: "id", // Indonesia
        text: userText
      }
    ]
  };

  try {
    const response = await fetch(sentimentUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_TEXT_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.error) {
      console.error("Azure Sentiment Result:", result);
      throw new Error("Azure Text Analytics Error: " + JSON.stringify(result.error));
    }

    const sentiment = result.documents?.[0]?.sentiment;
    const positiveReplies = [
  "Wah, senang banget dengarnya! Terus jaga semangatmu ya 😊 Ngomong-ngomong, kamu bisa tanya aku soal hal-hal seperti apa itu judi online atau bagaimana cara menghindarinya.",
  "Asik! Suasana hati yang positif itu bisa menular, teruskan ya 💪 Kalau penasaran soal dampak judi online atau tips menjaga kesehatan mental, tinggal tanya aja ya!",
  "Kabar bagus! Semoga energi baikmu bikin harimu makin cerah 🌞 Kalau kamu ingin tahu misalnya tanda-tanda seseorang kecanduan judi, aku bisa bantu jawab.",
  "Senang dengarnya! Kalau kamu ada pertanyaan seputar cara mencegah kecanduan judi atau tempat cari bantuan, silakan tanya ya!"
];

const negativeReplies = [
  "Terima kasih sudah cerita. Aku tahu hari-hari berat itu nyata 😔 Kalau kamu ingin tahu misalnya apa dampak buruk dari judi online terhadap mental, aku siap bantu jelaskan.",
  "Aku ngerti, kadang hari terasa berat. Kamu nggak sendiri kok. Ngomong-ngomong, kamu juga bisa tanya aku soal cara mencegah kecanduan judi atau tempat cari bantuan profesional.",
  "Perasaan sedih itu wajar banget. Kalau kamu mau cerita atau mau tahu tanda-tanda kecanduan judi, aku di sini buat bantu 😊",
  "Terima kasih sudah jujur sama perasaanmu. Kalau kamu penasaran soal kenapa judi online bisa bikin kecanduan, aku bisa bantu jawab kok."
];

const neutralReplies = [
  "Terima kasih sudah berbagi. Kalau kamu ingin tahu lebih dalam tentang apa itu judi online atau dampaknya, aku siap bantu jawab 😊",
  "Oke noted ya. Kalau kamu mau tanya soal bagaimana cara mencegah kecanduan judi atau cari bantuan, langsung aja tanya ke aku ya.",
  "Makasih sudah jawab. Kalau ada pertanyaan soal efek judi online terhadap kesehatan mental atau hal lainnya, aku siap bantu 🙌",
  "Kalau nanti kamu ingin tahu soal tanda-tanda kecanduan judi atau ingin cari tempat minta bantuan, aku bisa bantu cari infonya."
];

    function getRandomReply(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let reply;
if (sentiment === 'positive') {
  reply = getRandomReply(positiveReplies);
} else if (sentiment === 'negative') {
  reply = getRandomReply(negativeReplies);
} else if (sentiment === 'neutral') {
  reply = getRandomReply(neutralReplies);
} else {
  reply = "Maaf, tidak bisa mendeteksi mood dari jawabanmu. Coba tuliskan lebih panjang ya 😊";
}


    res.json({
      opening: "Chatbot ini dirancang untuk membantumu memantau suasana hati dan memahami dampak dari kecanduan judi online terhadap kesehatan mental. Bagaimana perasaanmu hari ini?",
      sentiment,
      answer: reply,
      status: "mood-checked"
    });

  } catch (error) {
    console.error("Mood Check Error:", error);
    res.status(500).json({ error: error.toString() });
  }
});

// 2.Rute: QA Chat (Azure Language Studio)
app.post('/ask', async (req, res) => {
  const question = req.body.question;

  const endpoint = `${process.env.AZURE_ENDPOINT}/language/:query-knowledgebases?projectName=${process.env.PROJECT_NAME}&deploymentName=${process.env.DEPLOYMENT_NAME}&api-version=2021-10-01`;

  const payload = {
    question,
    top: 1
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.answers && result.answers.length > 0) {
      const answer = result.answers[0].answer;
      res.json({ answer });
    } else {
      res.json({ answer: "Maaf, aku belum punya jawaban untuk itu. Coba pertanyaan lain ya!" });
    }
  } catch (error) {
    console.error("Ask Error:", error);
    res.status(500).json({ error: error.toString() });
  }
});




app.get('/', (req, res) => {
  res.send("✅ Judiaware backend is running.");
});
