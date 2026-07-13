import http from 'node:http';
import { access, mkdir, readFile, rename, rm, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { VOCABULARY } from './public/vocabulary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const generatedAudioDir = path.join(__dirname, '.generated-reference-audio');
const execFileAsync = promisify(execFile);
const vocabularyById = new Map(VOCABULARY.map((word) => [word.id, word]));
const generationJobs = new Map();

const preferredVoiceNames = {
  female: ['Veena', 'Lekha', 'Samantha', 'Karen', 'Moira', 'Serena', 'Tessa', 'Fiona', 'Ava', 'Allison'],
  male: ['Rishi', 'Ravi', 'Daniel', 'Alex', 'Oliver', 'Tom', 'Aaron', 'Arthur', 'Fred']
};

const knownFemaleVoices = new Set(preferredVoiceNames.female.map((name) => name.toLowerCase()));
const knownMaleVoices = new Set(preferredVoiceNames.male.map((name) => name.toLowerCase()));
let macVoicePromise = null;

try {
  const envText = readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!(key.trim() in process.env)) process.env[key.trim()] = rest.join('=').trim().replace(/^['\"]|['\"]$/g, '');
  }
} catch {
  // .env is optional.
}

const port = Number(process.env.PORT || 4173);
const sarvamKey = process.env.SARVAM_API_KEY?.trim() || '';
const maxBodyBytes = 14 * 1024 * 1024;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav'
};

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function parseMacVoices(output = '') {
  return output.split(/\r?\n/).map((line) => {
    const match = line.match(/^(.+?)\s+([a-z]{2}_[A-Z]{2})\s+#/);
    if (!match) return null;
    return { name: match[1].trim(), lang: match[2].replace('_', '-') };
  }).filter(Boolean);
}

async function getMacVoices() {
  if (process.platform !== 'darwin') return [];
  if (!macVoicePromise) {
    macVoicePromise = execFileAsync('say', ['-v', '?'], { maxBuffer: 1024 * 1024 })
      .then(({ stdout }) => parseMacVoices(stdout))
      .catch(() => []);
  }
  return macVoicePromise;
}

function localeRank(lang = '') {
  const value = lang.replace('_', '-').toLowerCase();
  if (value === 'hi-in') return 0;
  if (value === 'en-in') return 1;
  if (value === 'en-gb') return 2;
  if (value === 'en-au') return 3;
  if (value === 'en-us') return 4;
  return 10;
}

async function chooseNaturalVoice(gender) {
  const voices = await getMacVoices();
  const preferred = preferredVoiceNames[gender] || preferredVoiceNames.female;
  for (const name of preferred) {
    const expected = name.toLowerCase();
    const exact = voices.find((voice) => {
      const actual = voice.name.toLowerCase();
      return actual === expected || actual.startsWith(`${expected} (`);
    });
    if (exact) return exact;
  }

  const knownSet = gender === 'male' ? knownMaleVoices : knownFemaleVoices;
  const known = voices
    .filter((voice) => knownSet.has(voice.name.toLowerCase()))
    .sort((a, b) => localeRank(a.lang) - localeRank(b.lang));
  if (known[0]) return known[0];

  return null;
}

function plainPhoneticText(word) {
  return (word.syllables || [word.iast || word.common || ''])
    .join(' ')
    .replace(/ā/gi, 'aa')
    .replace(/ī/gi, 'ee')
    .replace(/ū/gi, 'oo')
    .replace(/ś|ṣ/gi, 'sh')
    .replace(/ṅ/gi, 'ng')
    .replace(/ñ/gi, 'ny')
    .replace(/ṭ/gi, 't')
    .replace(/ḍ/gi, 'd')
    .replace(/ḥ/gi, 'h')
    .replace(/ṃ/gi, 'm')
    .replace(/ṛ/gi, 'ri')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function textForVoice(word, voice) {
  return /^hi-/i.test(voice?.lang || '')
    ? (word.devanagari || word.iast || word.common)
    : plainPhoneticText(word);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generateReferenceAudio(gender, wordId) {
  if (process.platform !== 'darwin') {
    throw new Error('Natural Mac voices are available only when the app is running on macOS.');
  }
  const word = vocabularyById.get(wordId);
  if (!word) throw new Error('Unknown Sanskrit word.');
  const voice = await chooseNaturalVoice(gender);
  if (!voice) throw new Error('No compatible Mac speech voice is installed.');

  const voiceFolder = voice.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'voice';
  const folder = path.join(generatedAudioDir, gender, voiceFolder);
  const target = path.join(folder, `${wordId}.wav`);
  if (await fileExists(target)) return { target, voice };

  const jobKey = `${gender}:${wordId}`;
  if (!generationJobs.has(jobKey)) {
    generationJobs.set(jobKey, (async () => {
      await mkdir(folder, { recursive: true });
      const temporary = `${target}.${process.pid}.tmp.wav`;
      try {
        await execFileAsync('say', [
          '-v', voice.name,
          '-r', '165',
          '-o', temporary,
          '--file-format=WAVE',
          '--data-format=LEI16@16000',
          textForVoice(word, voice)
        ], { maxBuffer: 1024 * 1024 });
        const info = await stat(temporary);
        if (info.size < 1000) throw new Error('The Mac voice produced an empty recording.');
        await rename(temporary, target);
      } finally {
        await rm(temporary, { force: true }).catch(() => {});
      }
      return { target, voice };
    })().finally(() => generationJobs.delete(jobKey)));
  }
  return generationJobs.get(jobKey);
}

async function naturalVoiceStatus() {
  const [female, male] = await Promise.all([
    chooseNaturalVoice('female'),
    chooseNaturalVoice('male')
  ]);
  return {
    supported: process.platform === 'darwin',
    female: { available: Boolean(female), name: female?.name || '', lang: female?.lang || '' },
    male: { available: Boolean(male), name: male?.name || '', lang: male?.lang || '' }
  };
}

async function handleReferenceAudio(req, res, gender, wordId) {
  try {
    const { target, voice } = await generateReferenceAudio(gender, wordId);
    const content = await readFile(target);
    res.writeHead(200, {
      'Content-Type': 'audio/wav',
      'Content-Length': content.length,
      'Cache-Control': 'no-cache',
      'X-Vani-Reference-Voice': encodeURIComponent(voice.name)
    });
    if (req.method === 'HEAD') res.end();
    else res.end(content);
  } catch (error) {
    sendJson(res, 503, { error: error?.message || 'Could not prepare the selected natural voice.' });
  }
}

function collectJson(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBodyBytes) {
        reject(new Error('Recording is too large. Keep each attempt under 30 seconds.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Invalid request body.'));
      }
    });
    req.on('error', reject);
  });
}

function extensionForMime(mimeType = '') {
  const value = mimeType.toLowerCase();
  if (value.includes('webm')) return '.webm';
  if (value.includes('ogg')) return '.ogg';
  if (value.includes('mp4') || value.includes('m4a')) return '.m4a';
  if (value.includes('wav')) return '.wav';
  if (value.includes('mpeg') || value.includes('mp3')) return '.mp3';
  return '.webm';
}

async function handleTranscription(req, res) {
  if (!sarvamKey) {
    sendJson(res, 503, {
      error: 'Enhanced Sanskrit recognition is not configured. Add SARVAM_API_KEY or select Browser recognition.'
    });
    return;
  }

  try {
    const body = await collectJson(req);
    const { audioBase64, mimeType = 'audio/webm' } = body || {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      sendJson(res, 400, { error: 'No recording was supplied.' });
      return;
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    if (!audioBuffer.length) {
      sendJson(res, 400, { error: 'The recording was empty.' });
      return;
    }

    const form = new FormData();
    form.append(
      'file',
      new Blob([audioBuffer], { type: mimeType }),
      `pronunciation${extensionForMime(mimeType)}`
    );
    form.append('model', 'saaras:v3');
    form.append('mode', 'translit');
    form.append('language_code', 'sa-IN');

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': sarvamKey },
      body: form
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.detail?.message || data?.detail || data?.error || `Speech service returned ${response.status}.`;
      sendJson(res, response.status, { error: String(message) });
      return;
    }

    sendJson(res, 200, {
      transcript: data.transcript || '',
      languageCode: data.language_code || 'sa-IN',
      source: 'sarvam'
    });
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Speech recognition failed.' });
  }
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === '/') pathname = '/index.html';

  const safeRelative = path.normalize(pathname).replace(/^([.][.][/\\])+/, '').replace(/^[/\\]+/, '');
  let filePath = path.join(publicDir, safeRelative);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = path.join(filePath, 'index.html');
    const content = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Content-Length': content.length,
      'Cache-Control': ['.png', '.ico'].includes(ext) ? 'public, max-age=86400' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'microphone=(self)'
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/status') {
    sendJson(res, 200, {
      sarvamEnabled: Boolean(sarvamKey),
      browserRecognitionHint: 'Best tested in Chrome or Edge on localhost.',
      naturalVoices: await naturalVoiceStatus()
    });
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const referenceMatch = requestUrl.pathname.match(/^\/api\/reference\/(male|female)\/([a-z0-9-]+)\.wav$/);
  if ((req.method === 'GET' || req.method === 'HEAD') && referenceMatch) {
    await handleReferenceAudio(req, res, referenceMatch[1], referenceMatch[2]);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/transcribe') {
    await handleTranscription(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD, POST' }).end('Method not allowed');
    return;
  }

  await serveStatic(req, res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`\nVāṇī Sanskrit Coach is running at http://localhost:${port}`);
  console.log(sarvamKey
    ? 'Enhanced Sanskrit recognition: enabled\n'
    : 'Enhanced Sanskrit recognition: off (browser mode remains available)\n');
});
