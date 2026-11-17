// ビルド後に、品種改良ゲームの入口 dist/game/index.html を作る。
// 中身は同じアプリで、src/main.tsx が URL（/game/）を見てゲームを開く。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const TITLE = 'メンデルの畑 - エンドウ遺伝シミュレーター';
const GAME_TITLE = 'メンデルの畑 品種改良ゲーム';
const DESC_RE = /(<meta (?:name="description"|property="og:description") content=")[^"]*"/g;
const GAME_DESC = '注文どおりのエンドウ豆を交配で作って納品する、品種改良ゲーム。顕性・分離・純系の見分け方を、遊びながら確かめる。';

const html = readFileSync('dist/index.html', 'utf8')
  .replaceAll('"./', '"../')
  .replaceAll(TITLE, GAME_TITLE)
  .replace(DESC_RE, `$1${GAME_DESC}"`)
  .replace('content="https://mendel.meetupsensei.com/"', 'content="https://mendel.meetupsensei.com/game/"');

if (!html.includes('"../assets/')) throw new Error('dist/index.html の形が変わっています。make-game-page.mjs を見直してください');
mkdirSync('dist/game', { recursive: true });
writeFileSync('dist/game/index.html', html);
console.log('dist/game/index.html を作りました');
