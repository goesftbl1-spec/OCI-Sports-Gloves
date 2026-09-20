import React, { useState } from 'react';
import { X, Ruler, CheckCircle2 } from 'lucide-react';
import { SIZING_DATA } from '../data/mockData';
import { GloveSize } from '../types';

interface SizingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize?: (size: GloveSize) => void;
}

export const SizingGuideModal: React.FC<SizingGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectSize
}) => {
  if (!isOpen) return null;

  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const [handLength, setHandLength] = useState<number>(18.5);

  const currentLengthInCm = unit === 'in' ? handLength * 2.54 : handLength;

  // S, M, L calculation for ELITE 2.0
  const getRecommendedSize = (lengthCm: number): GloveSize => {
    if (lengthCm <= 18.0) return 'S';
    if (lengthCm <= 19.5) return 'M';
    return 'L';
  };

  const recommended = getRecommendedSize(currentLengthInCm);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        id="sizing-guide-modal"
        className="relative w-full max-w-xl bg-[#111114] border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          id="close-sizing-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-800"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#e5b338]/20 border border-[#e5b338] flex items-center justify-center text-[#e5b338]">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-['Outfit']">
              ELITE 2.0 Sizing Guide
            </h2>
            <p className="text-xs text-zinc-400">
              Measure from wrist crease to middle fingertip for your best GAA match fit.
            </p>
          </div>
        </div>

        {/* Interactive Hand Calculator */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Hand Length:
            </span>
            <div className="flex rounded-md bg-zinc-900 p-0.5 border border-zinc-800 text-[11px] font-bold">
              <button
                onClick={() => {
                  if (unit === 'in') setHandLength(Number((handLength * 2.54).toFixed(1)));
                  setUnit('cm');
                }}
                className={`px-2.5 py-0.5 rounded ${unit === 'cm' ? 'bg-[#e5b338] text-black font-black' : 'text-zinc-400'}`}
              >
                CM
              </button>
              <button
                onClick={() => {
                  if (unit === 'cm') setHandLength(Number((handLength / 2.54).toFixed(1)));
                  setUnit('in');
                }}
                className={`px-2.5 py-0.5 rounded ${unit === 'in' ? 'bg-[#e5b338] text-black font-black' : 'text-zinc-400'}`}
              >
                INCHES
              </button>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-black text-white font-['Outfit']">
                {handLength} {unit}
              </span>
              <span className="text-xs text-zinc-400">
                Range: {unit === 'cm' ? '15.0 - 22.0 cm' : '6.0 - 8.8 in'}
              </span>
            </div>
            <input
              type="range"
              min={unit === 'cm' ? 15 : 6.0}
              max={unit === 'cm' ? 22 : 8.8}
              step={0.1}
              value={handLength}
              onChange={(e) => setHandLength(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#e5b338]"
            />
          </div>

          {/* Recommended Result Banner */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-[#e5b338]/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-[#e5b338] uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#e5b338]" />
                Recommended Size
              </div>
              <div className="text-3xl font-black text-white font-['Outfit'] uppercase">
                Size {recommended}
              </div>
            </div>

            {onSelectSize && (
              <button
                onClick={() => {
                  onSelectSize(recommended);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-[#e5b338] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#f5df88] transition-colors cursor-pointer"
              >
                Select Size {recommended}
              </button>
            )}
          </div>
        </div>

        {/* Size Chart Table */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Official Gaelic Sizing Matrix
          </h4>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900 text-zinc-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Size</th>
                  <th className="p-3">Length (cm)</th>
                  <th className="p-3">Palm Width (cm)</th>
                  <th className="p-3">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {SIZING_DATA.map((row) => (
                  <tr
                    key={row.size}
                    className={`hover:bg-zinc-900/40 transition-colors ${
                      recommended === row.size ? 'bg-[#e5b338]/10 text-white font-semibold' : 'text-zinc-400'
                    }`}
                  >
                    <td className="p-3 font-bold text-white">Size {row.size}</td>
                    <td className="p-3">{row.handLengthCm} cm</td>
                    <td className="p-3">{row.palmWidthCm} cm</td>
                    <td className="p-3">{row.ageGuide}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
