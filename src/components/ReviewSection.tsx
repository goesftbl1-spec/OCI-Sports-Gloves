import React, { useState } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquarePlus, Filter, X, ShieldCheck } from 'lucide-react';
import { Review } from '../types';

interface ReviewSectionProps {
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id' | 'date' | 'helpfulCount'>) => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ reviews, onAddReview }) => {
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [author, setAuthor] = useState('');
  const [club, setClub] = useState('');
  const [county, setCounty] = useState('Dublin');
  const [position, setPosition] = useState<'Forward' | 'Midfield' | 'Defender' | 'Goalkeeper'>('Midfield');
  const [gloveModel, setGloveModel] = useState('OCI Apex Gold Championship Pro');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});

  const toggleHelpful = (id: string) => {
    setHelpfulVoted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredReviews = reviews.filter((r) => {
    if (selectedRatingFilter && r.rating !== selectedRatingFilter) return false;
    if (selectedPositionFilter && r.position !== selectedPositionFilter) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim() || !title.trim()) return;

    onAddReview({
      author: author.trim(),
      club: club.trim() || 'Club Player',
      county,
      position,
      gloveModel,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      verifiedBuyer: true,
      gripRating: rating,
      durabilityRating: rating
    });

    setAuthor('');
    setClub('');
    setTitle('');
    setComment('');
    setModalOpen(false);
  };

  const irishCounties = [
    'Dublin', 'Kerry', 'Galway', 'Mayo', 'Tyrone', 'Cork', 'Armagh', 'Derry',
    'Donegal', 'Meath', 'Kildare', 'Limerick', 'Clare', 'Tipperary', 'Kilkenny',
    'Wexford', 'Monaghan', 'Cavan', 'Roscommon', 'Sligo', 'Antrim', 'Down',
    'Fermanagh', 'Louth', 'Westmeath', 'Offaly', 'Laois', 'Wicklow', 'Carlow',
    'Longford', 'Leitrim', 'Waterford'
  ];

  return (
    <section id="reviews" className="py-20 sm:py-28 bg-[#09090b] border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-extrabold uppercase tracking-widest text-[#d4af37] mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              Verified Gaelic Footballers
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-['Outfit']">
              PROVEN ON THE <span className="text-gold-gradient">CLUB & COUNTY SOD</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl">
              Real matchday feedback from Senior, Minor, and Club players across Ireland testing OCI gloves in driving rain, sleet, and summer heat.
            </p>
          </div>

          {/* Action: Write Review Button */}
          <div className="flex items-center gap-3">
            <button
              id="open-write-review-btn"
              onClick={() => setModalOpen(true)}
              className="px-5 py-3 rounded-lg bg-zinc-900 hover:bg-[#d4af37] border border-zinc-700 hover:border-[#d4af37] text-white hover:text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Leave Player Review</span>
            </button>
          </div>
        </div>

        {/* Overall Score Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-[#111114] border border-zinc-800/90 mb-10">
          <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-zinc-800 pb-4 md:pb-0">
            <div className="text-4xl font-black text-white font-['Outfit']">4.70</div>
            <div>
              <div className="flex text-[#d4af37]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#d4af37]" />
                ))}
              </div>
              <div className="text-xs text-zinc-400 font-semibold mt-0.5">Based on 420+ Reviews</div>
            </div>
          </div>

          <div className="text-left px-2">
            <div className="text-[11px] text-zinc-400 uppercase font-semibold">Wet Weather Grip</div>
            <div className="text-xl font-bold text-sky-400 mt-0.5">9.9 / 10</div>
            <div className="text-[10px] text-zinc-500">98% report zero slip on wet leather</div>
          </div>

          <div className="text-left px-2">
            <div className="text-[11px] text-zinc-400 uppercase font-semibold">Tear Durability</div>
            <div className="text-xl font-bold text-[#d4af37] mt-0.5">9.6 / 10</div>
            <div className="text-[10px] text-zinc-500">Reinforced seams resist tackle rips</div>
          </div>

          <div className="text-left px-2">
            <div className="text-[11px] text-zinc-400 uppercase font-semibold">Recommendation Rate</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">99.4%</div>
            <div className="text-[10px] text-zinc-500">Would recommend to club teammates</div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-8 pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mr-2 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter by:</span>
          </div>

          <button
            onClick={() => {
              setSelectedRatingFilter(null);
              setSelectedPositionFilter(null);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
              selectedRatingFilter === null && selectedPositionFilter === null
                ? 'bg-[#d4af37] text-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All Reviews ({reviews.length})
          </button>

          <button
            onClick={() => setSelectedRatingFilter(selectedRatingFilter === 5 ? null : 5)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-1 ${
              selectedRatingFilter === 5
                ? 'bg-[#d4af37] text-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>5 Stars Only</span>
          </button>

          {['Midfield', 'Forward', 'Goalkeeper', 'Defender'].map((pos) => (
            <button
              key={pos}
              onClick={() => setSelectedPositionFilter(selectedPositionFilter === pos ? null : pos)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                selectedPositionFilter === pos
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReviews.map((rev) => {
            const hasVoted = helpfulVoted[rev.id];
            return (
              <div
                key={rev.id}
                className="bg-[#111114] border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 shadow-md"
              >
                <div>
                  {/* Top Bar: Stars + Date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-[#d4af37]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#d4af37]" />
                      ))}
                    </div>
                    <span className="text-[11px] text-zinc-500">{rev.date}</span>
                  </div>

                  {/* Review Title */}
                  <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2 font-['Outfit']">
                    "{rev.title}"
                  </h4>

                  {/* Review Content */}
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {rev.comment}
                  </p>

                  {/* Glove Tag */}
                  <div className="mt-3 inline-block px-2 py-0.5 rounded bg-zinc-950 text-[10px] font-bold text-zinc-400 border border-zinc-850">
                    Pair: {rev.gloveModel}
                  </div>
                </div>

                {/* Author Info Footer */}
                <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{rev.author}</span>
                      {rev.verifiedBuyer && (
                        <span title="Verified GAA Buyer" className="text-[#d4af37] flex items-center">
                          <CheckCircle className="w-3.5 h-3.5 fill-[#d4af37] text-black" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {rev.club} • Co. {rev.county} ({rev.position})
                    </div>
                  </div>

                  {/* Helpful Button */}
                  <button
                    onClick={() => toggleHelpful(rev.id)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors ${
                      hasVoted
                        ? 'bg-[#d4af37]/20 text-[#d4af37]'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{rev.helpfulCount + (hasVoted ? 1 : 0)}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Write a Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#111114] border border-zinc-700 rounded-2xl p-6 sm:p-7 text-white max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black uppercase tracking-tight font-['Outfit'] mb-1">
              Submit Player Review
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Share your on-pitch experience with fellow GAA footballers and club teams.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cillian O'Connor"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                    GAA Club
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ballintubber GAA"
                    value={club}
                    onChange={(e) => setClub(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                    County
                  </label>
                  <select
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                  >
                    {irishCounties.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                    Position
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                  >
                    <option value="Forward">Forward</option>
                    <option value="Midfield">Midfield</option>
                    <option value="Defender">Defender</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Model Tested
                </label>
                <select
                  value={gloveModel}
                  onChange={(e) => setGloveModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                >
                  <option value="OCI Apex Gold Championship Pro">OCI Apex Gold Championship Pro</option>
                  <option value="OCI Stealth Silver All-Weather">OCI Stealth Silver All-Weather</option>
                  <option value="OCI Pure Whiteout Matchday Edition">OCI Pure Whiteout Matchday Edition</option>
                  <option value="OCI Stealth Blackout Pro Edition">OCI Stealth Blackout Pro Edition</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Overall Grip & Performance Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1.5 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= rating ? 'text-[#d4af37] fill-[#d4af37]' : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Total grip under wet high balls"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">
                  Matchday Review *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="How did the gloves handle in match conditions? Talk about ball feel, grip in wet grass, wrist fit..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#f5df88] to-[#d4af37] text-black font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-md"
                >
                  Publish Player Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
