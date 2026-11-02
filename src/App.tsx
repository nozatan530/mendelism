/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, PlantData, PodData, SeedItem, ShapeGenotype } from './types';
import {
  loadGameState,
  saveGameState,
  clearGameState,
  getDefaultSeedBagForLevel,
  createDefaultState,
} from './utils/storage';
import {
  generatePodsForPlant,
  isBagItemForLevel,
  isTargetSeed,
  mergeHarvestIntoBag,
  REQUIRED_SEEDS,
  takeSeedFromBag,
} from './utils/genetics';
import { playHarvestFanfare, playSuccessChime } from './utils/sound';
import { Header } from './components/Header';
import { GardenField } from './components/GardenField';
import { HarvestView } from './components/HarvestView';
import { StatsGraph } from './components/StatsGraph';
import { MysteryNote } from './components/MysteryNote';
import { SeedBagView } from './components/SeedBagView';
import { MendelGuide } from './components/MendelGuide';
import { FlowerModal } from './components/FlowerModal';
import { PredictionCard } from './components/PredictionCard';
import { DevCheckPanel } from './components/DevCheckPanel';

export default function App() {
  const [state, setState] = useState<GameState>(() => loadGameState());
  const [focusedPlantModal, setFocusedPlantModal] = useState<PlantData | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isCheckMode, setIsCheckMode] = useState(false);
  const [selectedSeedId, setSelectedSeedId] = useState<string | null>(null);

  // 初回マウント時にURLパラメータ ?check を判定
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('check')) {
        setIsCheckMode(true);
      }
    }
  }, []);

  // 状態変更の自動保存 (localStorage)
  useEffect(() => {
    saveGameState(state);
  }, [state]);

  // モーダル表示中の株が畑で更新された場合に同期
  useEffect(() => {
    if (focusedPlantModal) {
      const updated = state.plots.find((p) => p?.id === focusedPlantModal.id);
      if (updated) {
        setFocusedPlantModal(updated);
      }
    }
  }, [state.plots, focusedPlantModal]);

  // ==========================================
  // ハンドラー: タブ切替・レベル切替
  // ==========================================
  const handleTabChange = (tab: GameState['activeTab']) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  };

  const handleLevelChange = (newLevel: 1 | 2 | 3 | 4) => {
    setState((prev) => {
      // そのレベルに必要な初期種子がまだ種袋にない場合は補充
      const levelDefaultSeeds = getDefaultSeedBagForLevel(newLevel, prev.lv3MysterySeeds);
      const existingIds = new Set(prev.seedBag.map((s) => s.id));
      const seedsToAdd = levelDefaultSeeds.filter((s) => !existingIds.has(s.id));

      return {
        ...prev,
        currentLevel: newLevel,
        seedBag: [...prev.seedBag, ...seedsToAdd],
        activeTab: 'garden',
      };
    });
  };

  const handleToggleSound = () => {
    setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleResetConfirm = () => {
    clearGameState();
    const fresh = createDefaultState();
    setState(fresh);
    setShowResetConfirm(false);
  };

  // ==========================================
  // ハンドラー: 畑での栽培・種まき
  // ==========================================
  const newPlant = (slotIndex: number, seed: SeedItem): PlantData => ({
    id: `plant_${Date.now()}_${slotIndex}`,
    slotIndex,
    seed: { ...seed, id: `plant_seed_${Date.now()}_${slotIndex}` },
    stage: 'SEEDED',
    isEmasculated: false,
    pollinatedByPlantId: null,
    pollinationResult: 'self',
    pods: [],
  });

  const handlePlantSeed = (slotIndex: number, seedBagItemId: string) => {
    setState((prev) => {
      const taken = takeSeedFromBag(prev.seedBag, seedBagItemId);
      if (!taken) return prev;
      const newPlots = [...prev.plots];
      newPlots[slotIndex] = newPlant(slotIndex, taken.seed);
      return { ...prev, plots: newPlots, seedBag: taken.bag };
    });
  };

  const handlePlantAllAvailable = (seedBagItemId: string) => {
    setState((prev) => {
      let bag = prev.seedBag;
      const newPlots = [...prev.plots];
      for (let i = 0; i < newPlots.length; i++) {
        if (newPlots[i] !== null) continue;
        const taken = takeSeedFromBag(bag, seedBagItemId);
        if (!taken) break;
        bag = taken.bag;
        newPlots[i] = newPlant(i, taken.seed);
      }
      return { ...prev, plots: newPlots, seedBag: bag };
    });
  };

  // 成長ステージの段階進行
  const advancePlantStage = (plant: PlantData): PlantData => {
    switch (plant.stage) {
      case 'SEEDED':
        return { ...plant, stage: 'SPROUT' };
      case 'SPROUT':
        return { ...plant, stage: 'GROWING' };
      case 'GROWING':
        return { ...plant, stage: 'BUD' };
      case 'BUD':
        return { ...plant, stage: 'FLOWER' };
      case 'FLOWER': {
        // FLOWER -> PODS (サヤ結実計算)
        const { pods, actualPollination } = generatePodsForPlant(
          plant.seed,
          plant.isEmasculated,
          plant.pollinatorSeed || null
        );

        return {
          ...plant,
          stage: 'PODS',
          pods,
          pollinationResult: actualPollination,
        };
      }
      case 'PODS':
      default:
        return plant;
    }
  };

  const handleAdvanceTime = () => {
    setState((prev) => {
      const newPlots = prev.plots.map((p) => {
        if (!p) return null;
        return advancePlantStage(p);
      });
      return { ...prev, plots: newPlots };
    });
  };

  const handleFastForwardToPods = () => {
    setState((prev) => {
      let currentPlots = [...prev.plots];
      // 最大5回進めればどの段階からでもPODSに到達
      for (let step = 0; step < 5; step++) {
        currentPlots = currentPlots.map((p) => {
          if (!p) return null;
          return advancePlantStage(p);
        });
      }
      return { ...prev, plots: currentPlots };
    });
  };

  const handleClearPlots = () => {
    setState((prev) => ({
      ...prev,
      plots: Array(12).fill(null),
    }));
  };

  // ==========================================
  // ハンドラー: 除雄・受粉
  // ==========================================
  const handleEmasculate = (plantId: string) => {
    setState((prev) => {
      const newPlots = prev.plots.map((p) => {
        if (p?.id === plantId) {
          return { ...p, isEmasculated: true };
        }
        return p;
      });
      return { ...prev, plots: newPlots };
    });
  };

  const handlePollinate = (targetPlantId: string, donorPlantId: string) => {
    setState((prev) => {
      const donor = prev.plots.find((p) => p?.id === donorPlantId);
      const newPlots = prev.plots.map((p) => {
        if (p?.id === targetPlantId) {
          return {
            ...p,
            pollinatedByPlantId: donorPlantId,
            pollinatorSeed: donor ? donor.seed : undefined,
          };
        }
        return p;
      });
      return { ...prev, plots: newPlots };
    });
  };

  // ==========================================
  // ハンドラー: 収穫とサヤ割り
  // ==========================================
  const handleHarvestAll = () => {
    const plantsWithPods = state.plots.filter((p): p is PlantData => p !== null && p.stage === 'PODS');
    if (plantsWithPods.length === 0) return;

    const collectedPods: PodData[] = plantsWithPods.flatMap((plant) => plant.pods);
    const failedCount = plantsWithPods.filter((p) => p.pollinationResult === 'failed').length;
    const notes = [`${plantsWithPods.length}株から${collectedPods.length}個のサヤを収穫`];
    if (failedCount > 0) {
      notes.push(`${failedCount}株は除雄後に受粉しなかったため実りませんでした`);
    }

    playHarvestFanfare(state.soundEnabled);

    // 収穫台にサヤをセットし、収穫後の株を片付けて次の栽培を可能にする
    setState((prev) => ({
      ...prev,
      plots: prev.plots.map((p) => (p && p.stage === 'PODS' ? null : p)),
      currentHarvestPods: [...prev.currentHarvestPods, ...collectedPods],
      harvestHistoryNote: notes.join('。'),
      activeTab: 'harvest',
    }));
  };

  const handleCrackPod = (podId: string) => {
    setState((prev) => {
      const newPods = prev.currentHarvestPods.map((p) =>
        p.id === podId ? { ...p, isCracked: true } : p
      );
      return { ...prev, currentHarvestPods: newPods };
    });
  };

  const handleCrackAll = () => {
    setState((prev) => {
      const newPods = prev.currentHarvestPods.map((p) => ({ ...p, isCracked: true }));
      return { ...prev, currentHarvestPods: newPods };
    });
  };

  // 割った豆を種袋に保管 & 累計集計に加算
  const handleStoreSeeds = () => {
    const cracked = state.currentHarvestPods.filter((p) => p.isCracked);
    if (cracked.length === 0) return;

    const allSeeds: SeedItem[] = cracked.flatMap((pod) => pod.seeds);

    setState((prev) => {
      const currentLv = prev.currentLevel;
      const currentStats = { ...prev.levelStats[currentLv] };
      // 集計はそのレベルの実験で得た豆だけ。種袋にはすべて入れる
      const harvestedSeeds = allSeeds.filter((s) => isTargetSeed(currentLv, s));

      const lv3Results = { ...prev.lv3Results };
      cracked.forEach((pod) => {
        if (!pod.testedMysteryId) return;
        const r = lv3Results[pod.testedMysteryId] || { round: 0, wrinkled: 0 };
        const wrinkled = pod.seeds.filter((s) => s.phenotype.shape === 'wrinkled').length;
        lv3Results[pod.testedMysteryId] = {
          round: r.round + pod.seeds.length - wrinkled,
          wrinkled: r.wrinkled + wrinkled,
        };
      });

      let addedRound = 0;
      let addedWrinkled = 0;
      let addedYellow = 0;
      let addedGreen = 0;
      let addedRY = 0;
      let addedRG = 0;
      let addedWY = 0;
      let addedWG = 0;

      harvestedSeeds.forEach((s) => {
        if (s.phenotype.shape === 'round') addedRound++;
        else addedWrinkled++;

        if (s.phenotype.color === 'yellow') addedYellow++;
        else if (s.phenotype.color === 'green') addedGreen++;

        if (s.phenotype.shape === 'round' && s.phenotype.color === 'yellow') addedRY++;
        if (s.phenotype.shape === 'round' && s.phenotype.color === 'green') addedRG++;
        if (s.phenotype.shape === 'wrinkled' && s.phenotype.color === 'yellow') addedWY++;
        if (s.phenotype.shape === 'wrinkled' && s.phenotype.color === 'green') addedWG++;
      });

      const newTotal = currentStats.totalSeeds + harvestedSeeds.length;
      const newRound = currentStats.round + addedRound;
      const newWrinkled = currentStats.wrinkled + addedWrinkled;

      const newHistory = harvestedSeeds.length > 0
        ? [
            ...currentStats.history,
            {
              cumulativeCount: newTotal,
              roundRatio: newTotal > 0 ? newRound / newTotal : 0,
            },
          ]
        : currentStats.history;

      const updatedStats = {
        totalSeeds: newTotal,
        round: newRound,
        wrinkled: newWrinkled,
        yellow: currentStats.yellow + addedYellow,
        green: currentStats.green + addedGreen,
        roundYellow: currentStats.roundYellow + addedRY,
        roundGreen: currentStats.roundGreen + addedRG,
        wrinkledYellow: currentStats.wrinkledYellow + addedWY,
        wrinkledGreen: currentStats.wrinkledGreen + addedWG,
        history: newHistory,
      };

      return {
        ...prev,
        currentHarvestPods: [],
        levelStats: {
          ...prev.levelStats,
          [currentLv]: updatedStats,
        },
        seedBag: mergeHarvestIntoBag(prev.seedBag, allSeeds),
        lv3Results,
        activeTab: harvestedSeeds.length > 0 ? 'stats' : 'seedbag',
      };
    });
  };

  // ==========================================
  // ハンドラー: 謎解きノート
  // ==========================================
  const handleSelectNoteOption = (optionIndex: number) => {
    setState((prev) => {
      const lv = prev.currentLevel;
      const currentNote = prev.notebooks[lv];
      if (!currentNote) return prev;

      return {
        ...prev,
        notebooks: {
          ...prev.notebooks,
          [lv]: { ...currentNote, selectedOptionIndex: optionIndex },
        },
      };
    });
  };

  const handleLockPrediction = () => {
    setState((prev) => {
      const note = prev.notebooks[prev.currentLevel];
      if (note.selectedOptionIndex === null) return prev;
      return {
        ...prev,
        notebooks: {
          ...prev.notebooks,
          [prev.currentLevel]: { ...note, predictionLocked: true },
        },
      };
    });
  };

  const handleSubmitHypothesis = () => {
    setState((prev) => {
      const lv = prev.currentLevel;
      const currentNote = prev.notebooks[lv];
      if (!currentNote) return prev;

      playSuccessChime(prev.soundEnabled);

      // 前のレベル達成で次のレベルをアンロック
      // Lv3は推理の正解で次が開く
      const nextLv = lv + 1;
      const newUnlocked = lv >= 3 || prev.unlockedLevels.includes(nextLv)
        ? prev.unlockedLevels
        : [...prev.unlockedLevels, nextLv];

      return {
        ...prev,
        unlockedLevels: newUnlocked,
        notebooks: {
          ...prev.notebooks,
          [lv]: { ...currentNote, isSubmitted: true },
        },
      };
    });
  };

  const handleConfirmLv3Deduction = (answers: { [seedId: string]: ShapeGenotype }): boolean => {
    const isAllCorrect = state.lv3MysterySeeds.every((m) => {
      return answers[m.id] === m.realGenotype;
    });

    if (isAllCorrect) {
      setState((prev) => {
        const updatedMysteries = prev.lv3MysterySeeds.map((m) => ({
          ...m,
          userGuess: answers[m.id],
          confirmed: true,
        }));

        // 種袋のLv3謎の種子にも確定遺伝子型ラベルを反映
        const updatedSeedBag = prev.seedBag.map((item) => {
          const match = updatedMysteries.find((m) => `seed_bag_${m.id}` === item.id);
          if (match) {
            return {
              ...item,
              label: `${match.name} [遺伝子型: ${match.realGenotype}]`,
              sampleSeed: {
                ...item.sampleSeed,
                identifiedGenotype: match.realGenotype,
              },
            };
          }
          return item;
        });

        const newUnlocked = prev.unlockedLevels.includes(4)
          ? prev.unlockedLevels
          : [...prev.unlockedLevels, 4];

        return {
          ...prev,
          lv3MysterySeeds: updatedMysteries,
          seedBag: updatedSeedBag,
          unlockedLevels: newUnlocked,
        };
      });
      return true;
    }

    return false;
  };

  const lv = state.currentLevel;
  const visibleBag = state.seedBag.filter((item) => isBagItemForLevel(item, lv));
  const testedAll = state.lv3MysterySeeds.every((m) => state.lv3Results[m.id]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EE] text-[#2C3E2D]">
      {/* 1. ヘッダーナビゲーション */}
      <Header
        state={state}
        onTabChange={handleTabChange}
        onLevelChange={handleLevelChange}
        onToggleSound={handleToggleSound}
        onResetGame={() => setShowResetConfirm(true)}
      />

      {/* 2. メインコンテンツエリア */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {state.activeTab === 'garden' && !state.notebooks[lv].predictionLocked && (
          <PredictionCard
            note={state.notebooks[lv]}
            onSelectOption={handleSelectNoteOption}
            onLock={handleLockPrediction}
          />
        )}

        {state.activeTab === 'garden' && state.notebooks[lv].predictionLocked && (
          <div className="space-y-6">
            <MendelGuide state={state} />
            <GardenField
              state={state}
              seedBag={visibleBag}
              selectedSeedId={selectedSeedId}
              onSelectSeed={setSelectedSeedId}
              onPlantSeed={handlePlantSeed}
              onPlantAllAvailable={handlePlantAllAvailable}
              onAdvanceTime={handleAdvanceTime}
              onFastForwardToPods={handleFastForwardToPods}
              onHarvestAll={handleHarvestAll}
              onClearPlots={handleClearPlots}
              onOpenFlowerModal={(plant) => setFocusedPlantModal(plant)}
              onGoToHarvest={() => handleTabChange('harvest')}
            />
          </div>
        )}

        {state.activeTab === 'harvest' && (
          <HarvestView
            pods={state.currentHarvestPods}
            harvestNote={state.harvestHistoryNote}
            level={state.currentLevel}
            soundEnabled={state.soundEnabled}
            onCrackPod={handleCrackPod}
            onCrackAll={handleCrackAll}
            onStoreSeeds={handleStoreSeeds}
            onGoToGarden={() => handleTabChange('garden')}
            onGoToStats={() => handleTabChange('stats')}
          />
        )}

        {state.activeTab === 'stats' && (
          <StatsGraph
            stats={state.levelStats[state.currentLevel]}
            level={state.currentLevel}
          />
        )}

        {state.activeTab === 'notebook' && (
          <MysteryNote
            note={state.notebooks[state.currentLevel]}
            level={state.currentLevel}
            stats={state.levelStats[lv]}
            onGoToGarden={() => handleTabChange('garden')}
            canVerify={lv === 3 ? testedAll : state.levelStats[lv].totalSeeds >= REQUIRED_SEEDS[lv]}
            lv3Results={state.lv3Results}
            lv3MysterySeeds={state.lv3MysterySeeds}
            soundEnabled={state.soundEnabled}
            onSelectOption={handleSelectNoteOption}
            onSubmitHypothesis={handleSubmitHypothesis}
            onConfirmLv3Deduction={handleConfirmLv3Deduction}
          />
        )}

        {state.activeTab === 'seedbag' && (
          <SeedBagView
            seedBag={visibleBag}
            level={state.currentLevel}
            onSelectSeedToPlant={(id) => {
              setSelectedSeedId(id);
              handleTabChange('garden');
            }}
            onGoToGarden={() => handleTabChange('garden')}
          />
        )}
      </main>

      {/* 3. 花・つぼみの拡大ダイアログ（除雄・筆受粉） */}
      {focusedPlantModal && (
        <FlowerModal
          plant={focusedPlantModal}
          allPlants={state.plots}
          soundEnabled={state.soundEnabled}
          onClose={() => setFocusedPlantModal(null)}
          onEmasculate={handleEmasculate}
          onPollinate={handlePollinate}
        />
      )}

      {/* 4. リセット確認モーダル */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF7F0] border-2 border-[#D8C69F] rounded-2xl max-w-sm w-full p-6 shadow-xl text-center">
            <h3
              className="text-lg font-bold text-[#2A4428] mb-2"
              style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
            >
              最初からやり直しますか？
            </h3>
            <p className="text-xs text-stone-600 mb-6 leading-relaxed">
              これまでに集計したデータ、種袋、解放したレベル、謎解きノートの記録がすべて初期状態に戻ります。
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                リセットする
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 開発用 ?check 10,000粒検証ドロワー */}
      {isCheckMode && <DevCheckPanel />}
    </div>
  );
}
