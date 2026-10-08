const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SUPER_LIG_MACLAR = [
  { id: 1, ev: 'Galatasaray', dep: 'Fenerbahçe', tarih: 'Bu Hafta', evForm: 'G-G-G-B-G', depForm: 'G-G-M-G-G' },
  { id: 2, ev: 'Beşiktaş', dep: 'Trabzonspor', tarih: 'Bu Hafta', evForm: 'G-M-G-B-M', depForm: 'B-G-G-M-G' },
  { id: 3, ev: 'Başakşehir', dep: 'Adana Demirspor', tarih: 'Bu Hafta', evForm: 'G-B-M-G-G', depForm: 'M-M-B-M-M' },
  { id: 4, ev: 'Samsunspor', dep: 'Antalyaspor', tarih: 'Bu Hafta', evForm: 'G-G-G-M-B', depForm: 'B-M-G-M-G' }
];

app.get('/api/maclar', (req, res) => {
  res.json(SUPER_LIG_MACLAR);
});

app.post('/api/tahmin-al', async (req, res) => {
  const { macId } = req.body;
  const mac = SUPER_LIG_MACLAR.find(m => m.id === macId);

  if (!mac) {
    return res.status(404).json({ error: 'Maç bulunamadı.' });
  }

  const prompt = `
Sen Türkiye Süper Ligi konusunda uzmanlaşmış profesyonel bir futbol analiz yapay zekasısın.
Maç: ${mac.ev} vs ${mac.dep}
Ev Sahibi Formu (Son 5 Maç): ${mac.evForm}
Deplasman Formu (Son 5 Maç): ${mac.depForm}

Lütfen bu Süper Lig maçı için SADECE geçerli bir JSON yanıtı döndür:
{
  "ms": "1, X veya 2",
  "alt_ust": "2.5 Üst veya 2.5 Alt",
  "kg": "KG Var veya KG Yok",
  "guven": "%82",
  "skor_tahmini": "2 - 1",
  "analiz": "Süper Lig koşulları, takım formları ve taktiksel detayları içeren 2-3 cümlelik akıcı Türkçe yorum."
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const tahminData = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, mac: `${mac.ev} vs ${mac.dep}`, tahmin: tahminData });

  } catch (error) {
    console.error('AI Hatası:', error);
    res.status(500).json({ error: 'Tahmin oluşturulurken bir hata oluştu.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Süper Lig AI Sunucusu http://localhost:${PORT} üzerinde çalışıyor...`));
