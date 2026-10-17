#!/usr/bin/env node
/*
 * 네이버 CLOVA Voice (Premium) 로 어린이 목소리 클립 생성
 *
 *   NCP_CLIENT_ID=xxx NCP_CLIENT_SECRET=yyy node tools/gen-voice.mjs [speaker] [max]
 *
 *   speaker  기본 nhajun (하준·남자아이). 다른 아동 음성: ndain(다인·여), ngaram(가람·여),
 *            nmeow(야옹이), nwoof(멍멍이)
 *   max      몇까지 만들지 (기본 70)
 *
 * 결과: voice/n/1..max.mp3 ("하나" …), voice/count/1..max.mp3 ("오늘은 고래를 한 마리 먹었어요. 잘 자요."),
 *       voice/sleep.mp3. 이미 있는 파일은 건너뜀.
 *
 * 키 발급: 네이버 클라우드 플랫폼 콘솔 → AI·NAVER API → CLOVA Voice → Application 등록
 * 문서:   https://api.ncloud-docs.com/docs/ai-naver-clovavoice-ttspremium
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ID = process.env.NCP_CLIENT_ID, SECRET = process.env.NCP_CLIENT_SECRET;
const speaker = process.argv[2] || 'nhajun';
const MAX = Number(process.argv[3] || 70);
if (!ID || !SECRET) { console.error('NCP_CLIENT_ID / NCP_CLIENT_SECRET 환경변수가 필요합니다.'); process.exit(1); }

const ONES = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const ONES_DET = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
const TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
const koNumber = (n) => TENS[Math.floor(n / 10)] + ONES[n % 10];
const koCount = (n, unit) => { const t = Math.floor(n / 10), o = n % 10; return ((t === 2 && o === 0) ? '스무' : TENS[t] + ONES_DET[o]) + ' ' + unit; };

const exists = (p) => access(p).then(() => true, () => false);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function tts(text, outPath) {
  if (await exists(outPath)) { console.log('skip ', outPath); return; }
  const body = new URLSearchParams({ speaker, text, speed: '0', pitch: '0', volume: '0', format: 'mp3' });
  const res = await fetch('https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts', {
    method: 'POST',
    headers: { 'X-NCP-APIGW-API-KEY-ID': ID, 'X-NCP-APIGW-API-KEY': SECRET, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, Buffer.from(await res.arrayBuffer()));
  console.log('wrote', outPath, `"${text}"`);
  await sleep(150);
}

for (let n = 1; n <= MAX; n++) await tts(koNumber(n) + '!', join(ROOT, 'voice', 'n', `${n}.mp3`));
for (let n = 1; n <= MAX; n++) await tts(`오늘은 고래를 ${koCount(n, '마리')} 먹었어요. 잘 자요.`, join(ROOT, 'voice', 'count', `${n}.mp3`));
await tts('바다가 잠들었어요. 잘 자요.', join(ROOT, 'voice', 'sleep.mp3'));
console.log('완료');
