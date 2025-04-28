import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_DIR = path.join(process.cwd(), 'public', 'thumbnails');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Serve static files from public
app.use(express.static(path.join(process.cwd(), 'public')));

// Route to get or fetch thumbnail
app.get('/thumbnails/:id.png', async (req, res) => {
  try {
    const id = req.params.id;
    const filePath = path.join(CACHE_DIR, `${id}.png`);
    // If file exists, return it
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    // Otherwise fetch from Roblox and cache
    const apiUrl = `https://thumbnails.roblox.com/v1/assets?assetIds=${id}&size=768x432&format=png&isCircular=false`;
    const apiRes = await fetch(apiUrl);
    const json = await apiRes.json();
    const imgUrl = json.data?.[0]?.imageUrl;
    if (!imgUrl) return res.status(404).send('Thumbnail not found');

    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) throw new Error('Failed to download image');
    const buffer = await imgRes.buffer();
    fs.writeFileSync(filePath, buffer);
    res.type('png').send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
