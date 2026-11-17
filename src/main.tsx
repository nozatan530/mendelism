import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import GameApp from './game/GameApp.tsx';
import './index.css';

// 品種改良ゲームは /game/ で開く（手元では `npm run dev:game` でも開ける）
const isGame = !!import.meta.env.VITE_GAME_MODE || /\/game\/?$/.test(window.location.pathname);
if (isGame) document.title = 'メンデルの畑 品種改良ゲーム';

createRoot(document.getElementById('root')!).render(isGame ? <GameApp /> : <App />);
