import React, { useState } from 'react';
import { X, Star, CheckCircle, ThumbsUp, MessageSquarePlus } from 'lucide-react';
import { Review } from '../types';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id' | 'date' | 'helpfulCount'>) => void;
}

export const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isOpen,
  onClose,
  reviews,
  onAddReview
}) => {
  if (!isOpen) return null;

  const [isWriting, setIsWriting] = useState(false);
  const [author, setAuthor] = useState('');
  const [club, setClub] = useState('');
  const [county, setCounty] = useState('Dublin');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});

  const toggleHelpful = (id: string) => {
    setHelpfulVoted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim() || !title.trim()) return;

    onAddReview({
      author: author.trim(),
      club: club.trim() || 'Club Player',
      county,
      position: 'Forward',
      gloveModel: 'OCI Apex Gold Championship Pro',
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
    setIsWriting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#111114] border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-['Outfit']">
                Player Reviews
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#e5b338] text-black text-xs font-black">
                4.7 ★
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified feedback from Gaelic footballers across Ireland
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWriting(!isWriting)}
              className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-[#e5b338] border border-zinc-700 flex items-center gap-1.5"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>{isWriting ? 'Cancel' : 'Write Review'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Write Form */}
        {isWriting && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Your Name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:border-[#e5b338] outline-none"
              />
              <input
                type="text"
                placeholder="GAA Club & County"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:border-[#e5b338] outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Rating:</span>
              <div className="flex text-[#e5b338]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1"
                  >
                    <Star className={`w-4 h-4 ${s <= rating ? 'fill-[#e5b338]' : 'text-zinc-600'}`} />
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              required
              placeholder="Headline (e.g. Unbelievable grip in driving rain)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:border-[#e5b338] outline-none"
            />

            <textarea
              required
              rows={2}
              placeholder="How did the gloves handle in match conditions?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:border-[#e5b338] outline-none resize-none"
            />

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#e5b338] hover:bg-[#f5df88] text-black font-extrabold text-xs uppercase tracking-wider transition-colors"
            >
              Post Review
            </button>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-3.5">
          {reviews.map((rev) => {
            const hasVoted = helpfulVoted[rev.id];
            return (
              <div
                key={rev.id}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex text-[#e5b338]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#e5b338]" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-white">{rev.author}</span>
                    {rev.verifiedBuyer && (
                      <CheckCircle className="w-3.5 h-3.5 fill-[#e5b338] text-black" />
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-500">{rev.date}</span>
                </div>

                <div className="text-xs font-bold text-zinc-200">
                  "{rev.title}"
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {rev.comment}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[11px] text-zinc-500">
                  <span>{rev.club} • Co. {rev.county}</span>
                  <button
                    onClick={() => toggleHelpful(rev.id)}
                    className={`flex items-center gap-1 hover:text-zinc-300 ${hasVoted ? 'text-[#e5b338]' : ''}`}
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
    </div>
  );
};
