/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { runGeneticsVerification, CheckValidationResult } from '../utils/genetics';
import { CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export const DevCheckPanel: React.FC = () => {
  const [result, setResult] = useState<CheckValidationResult | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const runTest = () => {
    const res = runGeneticsVerification();
    setResult(res);
  };

  useEffect(() => {
    runTest();
  }, []);

  if (!result) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C281F]/95 text-stone-200 border-t-2 border-[#4A7836] shadow-2xl backdrop-blur-md text-xs font-mono select-none">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#A8D595] text-sm">
            [開発用検証 ?check] 遺伝シミュレーター 10,000粒試算
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              result.f2Mono.passed && result.f2Di.passed
                ? 'bg-emerald-800 text-emerald-200'
                : 'bg-red-800 text-red-200'
            }`}
          >
            {result.f2Mono.passed && result.f2Di.passed
              ? 'ALL PASS (±1%以内)'
              : 'VERIFICATION FAILED'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runTest}
            className="px-2.5 py-1 bg-stone-700 hover:bg-stone-600 rounded text-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>再計算</span>
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded text-stone-400 hover:text-stone-100 transition-colors"
            aria-label="開閉"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="max-w-6xl mx-auto px-4 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stone-700/80">
          {/* F2 (Aa×Aa) 10,000粒 */}
          <div className="bg-stone-900/60 p-3 rounded-lg border border-stone-700">
            <div className="flex items-center justify-between mb-1.5 font-bold text-stone-300">
              <span>① F2 (Aa×Aa) 10,000粒 分離の法則</span>
              {result.f2Mono.passed ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 合格
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> 不合格
                </span>
              )}
            </div>
            <div className="space-y-0.5 text-stone-400">
              <div>
                丸: <span className="text-stone-100 font-bold">{result.f2Mono.round}</span> (
                {(result.f2Mono.roundRatio * 100).toFixed(2)}%) [期待 75.00% ±1%]
              </div>
              <div>
                しわ: <span className="text-stone-100 font-bold">{result.f2Mono.wrinkled}</span> (
                {(result.f2Mono.wrinkledRatio * 100).toFixed(2)}%) [期待 25.00% ±1%]
              </div>
              <div className="text-[11px] text-stone-500">
                実測比率 ≒ {(result.f2Mono.round / result.f2Mono.wrinkled).toFixed(3)} : 1
              </div>
            </div>
          </div>

          {/* Lv4 F2 (AaBb×AaBb) 10,000粒 */}
          <div className="bg-stone-900/60 p-3 rounded-lg border border-stone-700">
            <div className="flex items-center justify-between mb-1.5 font-bold text-stone-300">
              <span>② Lv4 F2 (AaBb×AaBb) 10,000粒 独立の法則</span>
              {result.f2Di.passed ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 合格
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> 不合格
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1 text-stone-400">
              <div>
                丸黄: <span className="text-stone-100 font-bold">{result.f2Di.roundYellow}</span> (
                {(result.f2Di.ratioRY * 100).toFixed(2)}%)
              </div>
              <div>
                丸緑: <span className="text-stone-100 font-bold">{result.f2Di.roundGreen}</span> (
                {(result.f2Di.ratioRG * 100).toFixed(2)}%)
              </div>
              <div>
                しわ黄: <span className="text-stone-100 font-bold">{result.f2Di.wrinkledYellow}</span> (
                {(result.f2Di.ratioWY * 100).toFixed(2)}%)
              </div>
              <div>
                しわ緑: <span className="text-stone-100 font-bold">{result.f2Di.wrinkledGreen}</span> (
                {(result.f2Di.ratioWG * 100).toFixed(2)}%)
              </div>
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              比率 ≒ {(result.f2Di.ratioRY / result.f2Di.ratioWG).toFixed(2)} :{' '}
              {(result.f2Di.ratioRG / result.f2Di.ratioWG).toFixed(2)} :{' '}
              {(result.f2Di.ratioWY / result.f2Di.ratioWG).toFixed(2)} : 1 [期待 9:3:3:1]
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
