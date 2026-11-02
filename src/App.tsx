/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, PlantData, PlantGenotype, PodData, SeedItem, ShapeGenotype } from './types';
import {
  loadGameState,
  saveGameState,
  clearGameState,
  getDefaultSeedBagForLevel,
  createDefaultState,
} from './utils/storage';
import { generatePodsForPlant } from './utils/genetics';
import { playHarvestFanfare, playSuccessChime } from './utils/sound';
import { Header } from './components/Header';
import { GardenField } from './components/GardenField';
import { HarvestView } from './components/HarvestView';
import { StatsGraph } from './components/StatsGraph';
import { MysteryNote } from './components/MysteryNote';
import { SeedBagView } from './components/SeedBagView';
import { MendelGuide } from './components/MendelGuide';
import { FlowerModal } from './components/FlowerModal';
import { DevCheckPanel } from './components/DevCheckPanel';

export default function App() {
  const [state, setState] = useState<GameState>(() => loadGameState());
  const [focusedPlantModal, setFocusedPlantModal] = useState<PlantData | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isCheckMode, setIsCheckMode] = useState(false);

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
  const handlePlantSeed = (slotIndex: number, seedBagItemId: string) => {
    setState((prev) => {
      const bagItem = prev.seedBag.find((i) => i.id === seedBagItemId);
      if (!bagItem || bagItem.count <= 0) return prev;

      const newSeed: SeedItem = {
        ...bagItem.sampleSeed,
        id: `plant_seed_${Date.now()}_${slotIndex}`,
      };

      const newPlant: PlantData = {
        id: `plant_${Date.now()}_${slotIndex}`,
        slotIndex,
        seed: newSeed,
        stage: 'SEEDED',
        isEmasculated: false,
        pollinatedByPlantId: null,
        pollinationResult: 'self',
        pods: [],
      };

      const newPlots = [...prev.plots];
      newPlots[slotIndex] = newPlant;

      const newSeedBag = prev.seedBag.map((item) =>
        item.id === seedBagItemId ? { ...item, count: item.count - 1 } : item
      );

      return {
        ...prev,
        plots: newPlots,
        seedBag: newSeedBag,
      };
    });
  };

  const handlePlantAllAvailable = (seedBagItemId: string) => {
    setState((prev) => {
      const bagItem = prev.seedBag.find((i) => i.id === seedBagItemId);
      if (!bagItem || bagItem.count <= 0) return prev;

      let remainingCount = bagItem.count;
      const newPlots = [...prev.plots];

      for (let i = 0; i < newPlots.length; i++) {
        if (newPlots[i] === null && remainingCount > 0) {
          const newSeed: SeedItem = {
            ...bagItem.sampleSeed,
            id: `plant_seed_${Date.now()}_${i}`,
          };
          newPlots[i] = {
            id: `plant_${Date.now()}_${i}`,
            slotIndex: i,
            seed: newSeed,
            stage: 'SEEDED',
            isEmasculated: false,
            pollinatedByPlantId: null,
            pollinationResult: 'self',
            pods: [],
          };
          remainingCount--;
        }
      }

      const newSeedBag = prev.seedBag.map((item) =>
        item.id === seedBagItemId ? { ...item, count: remainingCount } : item
      );

      return {
        ...prev,
        plots: newPlots,
        seedBag: newSeedBag,
      };
    });
  };

  // 成長ステージの段階進行
  const advancePlantStage = (plant: PlantData, allPlots: (PlantData | null)[]): PlantData => {
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
        let pollinatorGenotype: PlantGenotype | null = null;
        let parentDesc = plant.seed.parentLabel || '自株';

        if (plant.pollinatedByPlantId) {
          const donor = allPlots.find((p) => p?.id === plant.pollinatedByPlantId);
          if (donor) {
            pollinatorGenotype = donor.seed.genotype;
            parentDesc = `${plant.seed.parentLabel || '母株'} × ${donor.seed.parentLabel || '花粉親'}`;
          }
        }

        const genLabel =
          plant.seed.generation === 'P'
            ? 'F1'
            : plant.seed.generation === 'F1'
            ? 'F2'
            : plant.seed.generation;

        const { pods, actualPollination } = generatePodsForPlant(
          plant.seed.genotype,
          plant.isEmasculated,
          pollinatorGenotype,
          genLabel as 'F1' | 'F2' | 'Custom',
          parentDesc
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
        return advancePlantStage(p, prev.plots);
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
          return advancePlantStage(p, currentPlots);
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
            pollinatorGenotype: donor ? donor.seed.genotype : undefined,
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

    let collectedPods: PodData[] = [];
    const notes: string[] = [];

    plantsWithPods.forEach((plant) => {
      if (plant.pods.length > 0) {
        collectedPods = [...collectedPods, ...plant.pods];
        if (plant.pollinationResult === 'self') {
          notes.push(`${plant.slotIndex + 1}番:自家受精`);
        } else if (plant.pollinationResult === 'cross') {
          notes.push(`${plant.slotIndex + 1}番:人工交配`);
        }
      }
    });

    playHarvestFanfare(state.soundEnabled);

    // 収穫台にサヤをセットし、収穫後の株を片付けて次の栽培を可能にする
    setState((prev) => {
      const newPlots = prev.plots.map((p) => (p && p.stage === 'PODS' ? null : p));
      return {
        ...prev,
        plots: newPlots,
        currentHarvestPods: collectedPods,
        harvestHistoryNote:
          collectedPods.length > 0
            ? `${plantsWithPods.length}株から${collectedPods.length}個のサヤを収穫（${notes.slice(0, 3).join('・')}など）`
            : '除雄後に受粉しなかったため、サヤが実りませんでした。',
        activeTab: 'harvest',
      };
    });
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

    let harvestedSeeds: SeedItem[] = [];
    cracked.forEach((pod) => {
      harvestedSeeds = [...harvestedSeeds, ...pod.seeds];
    });

    setState((prev) => {
      const currentLv = prev.currentLevel;
      const currentStats = { ...prev.levelStats[currentLv] };

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

      const newHistory = [
        ...currentStats.history,
        {
          cumulativeCount: newTotal,
          roundRatio: newTotal > 0 ? newRound / newTotal : 0,
        },
      ];

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

      // 種袋への追加（収穫した豆のサンプルを種袋ストックへ合流）
      // 代表的な表現型ごとに種袋アイテムを作成または加算
      let updatedSeedBag = [...prev.seedBag];
      if (harvestedSeeds.length > 0) {
        const firstSeed = harvestedSeeds[0];
        const newBagItem = {
          id: `harvested_seed_${Date.now()}`,
          sampleSeed: firstSeed,
          count: harvestedSeeds.length,
          label: `${firstSeed.generation} 収穫豆 (${firstSeed.phenotype.shape === 'round' ? '丸' : 'しわ'}${
            firstSeed.phenotype.color ? `・${firstSeed.phenotype.color === 'yellow' ? '黄' : '緑'}` : ''
          })`,
        };
        updatedSeedBag = [newBagItem, ...updatedSeedBag];
      }

      return {
        ...prev,
        currentHarvestPods: [],
        levelStats: {
          ...prev.levelStats,
          [currentLv]: updatedStats,
        },
        seedBag: updatedSeedBag,
        activeTab: 'stats',
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

  const handleSubmitHypothesis = () => {
    setState((prev) => {
      const lv = prev.currentLevel;
      const currentNote = prev.notebooks[lv];
      if (!currentNote) return prev;

      playSuccessChime(prev.soundEnabled);

      // 前のレベル達成で次のレベルをアンロック
      const nextLv = (lv + 1) as 2 | 3 | 4;
      const newUnlocked = prev.unlockedLevels.includes(nextLv)
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
        {state.activeTab === 'garden' && (
          <div className="space-y-6">
            <MendelGuide state={state} />
            <GardenField
              state={state}
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
            totalSeedsHarvested={state.levelStats[state.currentLevel].totalSeeds}
            lv3MysterySeeds={state.lv3MysterySeeds}
            soundEnabled={state.soundEnabled}
            onSelectOption={handleSelectNoteOption}
            onSubmitHypothesis={handleSubmitHypothesis}
            onConfirmLv3Deduction={handleConfirmLv3Deduction}
          />
        )}

        {state.activeTab === 'seedbag' && (
          <SeedBagView
            seedBag={state.seedBag}
            level={state.currentLevel}
            onSelectSeedToPlant={(id) => {
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
