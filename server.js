import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/spot', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const url = 'https://www.epexspot.com/en/market-results?market_area=BE&auction=MRC&sub_modality=DayAhead&data_mode=table';
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('table.market-table');

    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table.market-table tbody tr'));
      return rows.map(row => {
        const cols = row.querySelectorAll('td');
        const hour = cols[0]?.innerText.trim();
        const price = parseFloat(cols[1]?.innerText.replace(',', '.'));
        return { hour, price };
      }).filter(r => r.hour && !isNaN(r.price));
    });

    await browser.close();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Scraping failed', detail: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
