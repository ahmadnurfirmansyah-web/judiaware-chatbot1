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
  "Senang mendengarnya! Tetap semangat ya 😊 Kamu bisa mulai tanya apa pun soal dampak judi online atau tips menjaga kesehatan mental di sini.",
  "Wah, kabar yang menyenangkan! Jangan lupa terus jaga mood positifmu! Kamu bisa mulai tanya apa pun soal dampak judi online atau tips menjaga kesehatan mental di sini.",
  "Mantap! Energi positif itu menular, teruskan ya!",
  "Kabar bagus! Semoga harimu makin cerah 🌞"
];

const negativeReplies = [
  "Terima kasih sudah berbagi. Sepertinya kamu sedang tidak baik-baik saja 😔. Coba yuk, lakukan hal positif seperti journaling, berjalan-jalan ringan, atau dengarkan musik santai.",
  "Aku paham, kadang hari tidak berjalan sesuai harapan. Semangat ya, coba tarik napas dalam dan lakukan hal yang kamu suka.",
  "Terkadang, merasa sedih itu wajar kok. Kalau mau cerita atau bertanya, aku di sini 😊",
  "Terima kasih sudah jujur tentang perasaanmu. Ingat, kamu tidak sendiri. Yuk lakukan sesuatu yang menenangkan hati."
];

const neutralReplies = [
  "Terima kasih sudah menjawab! Aku di sini kalau kamu ingin bicara atau bertanya seputar kesehatan mental dan dampak judi online.",
  "Noted, terima kasih. Kalau ada hal yang ingin kamu ceritakan, aku siap mendengar 😊",
  "Oke, aku siap bantu kalau kamu butuh informasi atau teman ngobrol ya!",
  "Terima kasih, harapanku harimu tetap berjalan lancar ✨"
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
      opening: "Chatbot ini dirancang untuk mendukung kesehatan mental dan membantu memahami dampak judi online. Bagaimana kabarmu hari ini?",
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
