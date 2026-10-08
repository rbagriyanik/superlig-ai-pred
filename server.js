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

// Güncel Süper Lig 7. Hafta Maç Fikstürü
const SUPER_LIG_MACLAR = [
  { id: 1, ev: 'Galatasaray', dep: 'Kasımpaşa', tarih: '9 Ekim Cuma 20:00', evForm: 'G-G-M-G-G', depForm: 'B-M-B-G-B' },
  { id: 2, ev: 'Samsunspor', dep: 'Trabzonspor', tarih: '10 Ekim Cumartesi 16:00', evForm: 'M-G-G-B-M', depForm: 'G-B-G-M-G' },
  { id: 3, ev: 'Çaykur Rizespor', dep: 'Fenerbahçe', tarih: '10 Ekim Cumartesi 19:00', evForm: 'B-M-B-M-B', depForm: 'G-G-G-G-M' },
  { id: 4, ev: 'Konyaspor', dep: 'İstanbul Başakşehir', tarih: '11 Ekim Pazar 13:30', evForm: 'B-G-M-B-G', depForm: 'G-M-G-G-B' },
  { id: 5, ev: 'Beşiktaş', dep: 'Kocaelispor', tarih: '11 Ekim Pazar 19:00', evForm: 'M-G-B-M-G', depForm: 'G-B-M-G-M' },
  { id: 6, ev: 'Eyüpspor', dep: 'Göztepe', tarih: '12 Ekim Pazartesi 20:00', evForm: 'M-B-M-G-M', depForm: 'B-G-M-B-B' }
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
Tarih/Saat: ${mac.tarih}
Ev Sahibi Formu (Son 5 Maç): ${mac.evForm}
Deplasman Formu (Son 5 Maç): ${mac.depForm}

Lütfen bu Süper Lig maçı için SADECE geçerli bir JSON yanıtı döndür:
{
  "ms": "1, X veya 2",
  "alt_ust": "2.5 Üst veya 2.5 Alt",
  "kg": "KG Var veya KG Yok",
  "guven": "%84",
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
