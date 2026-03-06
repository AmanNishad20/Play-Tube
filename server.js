const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true }
);

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Section = mongoose.model('Section', sectionSchema);
const Video = mongoose.model('Video', videoSchema);

let runtimeMongoUri = '';

function getMongoUri() {
  return runtimeMongoUri || process.env.MONGODB_URI || '';
}

async function connectToMongo() {
  const uri = getMongoUri();
  if (!uri) {
    console.log('MongoDB URI missing. App running in disconnected mode.');
    return;
  }

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');
  await ensureInitialData();
}

async function ensureInitialData() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  let general = await Section.findOne({ name: 'General' });
  if (!general) {
    general = await Section.create({ name: 'General' });
  }

  const existingCount = await Video.countDocuments();
  if (existingCount === 0) {
    await Video.create({
      title: 'Welcome Video',
      url: 'https://drive.google.com/file/d/1mGqmx7y4ZX2wO9d5Gk8q_x2K2W8XJQ1M/view?usp=sharing',
      sectionId: general._id,
    });
  }
}

async function getSectionsPayload(search = '') {
  const query = search
    ? { title: { $regex: search, $options: 'i' } }
    : {};

  const sections = await Section.find().sort({ createdAt: 1 }).lean();
  const videos = await Video.find(query).sort({ createdAt: -1 }).lean();

  const sectionMap = new Map(
    sections.map((section) => [String(section._id), { ...section, videos: [] }])
  );

  for (const video of videos) {
    const id = String(video.sectionId);
    if (sectionMap.has(id)) {
      sectionMap.get(id).videos.push(video);
    }
  }

  return Array.from(sectionMap.values());
}

app.get('/api/health', async (_req, res) => {
  res.json({
    connected: mongoose.connection.readyState === 1,
    hasMongoUri: Boolean(getMongoUri()),
  });
});

app.post('/api/config/mongodb-uri', async (req, res) => {
  const { uri } = req.body ?? {};
  if (!uri || typeof uri !== 'string') {
    return res.status(400).json({ error: 'A valid MongoDB URI is required.' });
  }

  runtimeMongoUri = uri.trim();

  try {
    await connectToMongo();
    return res.json({ connected: mongoose.connection.readyState === 1 });
  } catch (error) {
    return res.status(400).json({ error: `MongoDB connection failed: ${error.message}` });
  }
});

app.get('/api/sections', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'MongoDB is not connected.' });
  }

  const search = (req.query.search || '').toString().trim();
  const payload = await getSectionsPayload(search);
  return res.json(payload);
});

app.post('/api/sections', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'MongoDB is not connected.' });
  }

  const name = (req.body?.name || '').toString().trim();
  if (!name) {
    return res.status(400).json({ error: 'Section name is required.' });
  }

  const existing = await Section.findOne({ name });
  if (existing) {
    return res.status(409).json({ error: 'Section already exists.' });
  }

  const section = await Section.create({ name });
  return res.status(201).json(section);
});

app.post('/api/videos', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'MongoDB is not connected.' });
  }

  const title = (req.body?.title || '').toString().trim();
  const url = (req.body?.url || '').toString().trim();
  const sectionId = (req.body?.sectionId || '').toString().trim();

  if (!title || !url || !sectionId) {
    return res.status(400).json({ error: 'Title, URL, and section are required.' });
  }

  const section = await Section.findById(sectionId);
  if (!section) {
    return res.status(404).json({ error: 'Section not found.' });
  }

  const video = await Video.create({ title, url, sectionId: section._id });
  return res.status(201).json(video);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, async () => {
  try {
    await connectToMongo();
  } catch (error) {
    console.log(`Initial MongoDB connection failed: ${error.message}`);
  }
  console.log(`PlayTube server running on http://localhost:${PORT}`);
});
