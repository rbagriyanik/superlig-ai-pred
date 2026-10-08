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

// Güncel Süper Lig Lideri Amedspor ve Süper Lig Fikstürü
const SUPER_LIG_MACLAR = [
  { id: 1, ev: 'Amedspor (Lider)', dep: 'Kasımpaşa', tarih: 'Bu Hafta', evForm: 'G-G-G-B-G', depForm: 'B-M-B-G-B' },
  { id: 2, ev: 'Galatasaray', dep: 'Trabzonspor', tarih: 'Bu Hafta', evForm: 'G-G-M-G-G', depForm: 'G-B-G-M-G' },
  { id: 3, ev: 'Fenerbahçe', dep: 'Beşiktaş', tarih: 'Bu Hafta', evForm: 'G-G-G-G-M', depForm: 'M-G-B-M-G' },
  { id: 4, ev: 'Samsunspor', dep: 'Başakşehir', tarih: 'Bu Hafta', evForm: 'M-G-G-B-M', depForm: 'G-M-G-G-B' },
  { id: 5, ev: 'Göztepe', dep: 'Konyaspor', tarih: 'Bu Hafta', evForm: 'B-G-M-B-B', depForm: 'B-G-M-B-G' }
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
Tarih/Etiket: ${mac.tarih}
Ev Sahibi Formu (Son 5 Maç): ${mac.evForm}
Deplasman Formu (Son 5 Maç): ${mac.depForm}

Lütfen bu Süper Lig maçı için SADECE geçerli bir JSON yanıtı döndür:
{
  "ms": "1, X veya 2",
  "alt_ust": "2.5 Üst veya 2.5 Alt",
  "kg": "KG Var veya KG Yok",
  "guven": "%90",
  "skor_tahmini": "3 - 1",
  "analiz": "Süper Lig lideri Amedspor ve rakibi arasındaki taktiksel analiz, form grafiği ve maç atmosferini içeren 2-3 cümlelik heyecanlı Türkçe yorum."
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
