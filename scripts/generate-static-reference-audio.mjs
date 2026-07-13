import { mkdir, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOCABULARY } from '../public/vocabulary.js';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputRoot = path.join(root, 'public', 'audio', 'natural');

const preferred = {
  female: ['Veena', 'Lekha', 'Samantha', 'Karen', 'Moira', 'Serena', 'Tessa', 'Fiona', 'Ava', 'Allison'],
  male: ['Rishi', 'Ravi', 'Daniel', 'Alex', 'Oliver', 'Tom', 'Aaron', 'Arthur', 'Fred']
};

function parseVoices(output = '') {
  return output.split(/\r?\n/).map((line) => {
    const match = line.match(/^(.+?)\s+([a-z]{2}_[A-Z]{2})\s+#/);
    return match ? { name: match[1].trim(), lang: match[2].replace('_', '-') } : null;
  }).filter(Boolean);
}

function chooseVoice(voices, gender) {
  for (const name of preferred[gender]) {
    const found = voices.find((voice) => voice.name === name || voice.name.startsWith(`${name} (`));
    if (found) return found;
  }
  const indian = voices.find((voice) => /^(hi|en)-IN$/i.test(voice.lang));
  return indian || voices.find((voice) => /^en-/i.test(voice.lang)) || voices[0];
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
  return /^hi-/i.test(voice.lang) ? (word.devanagari || word.iast || word.common) : plainPhoneticText(word);
}

if (process.platform !== 'darwin') {
  throw new Error('This build step must run on a macOS GitHub Actions runner.');
}

const { stdout } = await execFileAsync('say', ['-v', '?'], { maxBuffer: 1024 * 1024 });
const voices = parseVoices(stdout);
if (!voices.length) throw new Error('No macOS speech voices were found.');

for (const gender of ['female', 'male']) {
  const voice = chooseVoice(voices, gender);
  if (!voice) throw new Error(`No ${gender} voice was found.`);
  const folder = path.join(outputRoot, gender);
  await mkdir(folder, { recursive: true });
  console.log(`${gender}: ${voice.name} (${voice.lang})`);

  for (const word of VOCABULARY) {
    if (!word?.id || String(word.id).startsWith('custom-')) continue;
    const target = path.join(folder, `${word.id}.wav`);
    await execFileAsync('say', [
      '-v', voice.name,
      '-r', '165',
      '-o', target,
      '--file-format=WAVE',
      '--data-format=LEI16@16000',
      textForVoice(word, voice)
    ], { maxBuffer: 1024 * 1024 });
    const info = await stat(target);
    if (info.size < 1000) throw new Error(`Generated audio was empty: ${target}`);
  }
}
