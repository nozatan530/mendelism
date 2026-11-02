import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import GameApp from './game/GameApp.tsx';
import './index.css';

// 品種改良ゲームは開発中。`npm run dev:game` のときだけ開く
createRoot(document.getElementById('root')!).render(
  import.meta.env.VITE_GAME_MODE ? <GameApp /> : <App />,
);
