import React, { useState } from 'react';
import { Star, ThumbsUp, MoreHorizontal, MessageSquare, Filter, ChevronDown, Reply, MessageCircle, Image as ImageIcon, ShieldCheck } from 'lucide-react';

// Dummy reviews removed

const RatingStars = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"}
        />
      ))}
    </div>
  );
};

export const SellerReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleReplySubmit = (id) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, reply: replyText } : r));
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div className="w-full h-full bg-[#FCFDFD] text-sm max-w-[1400px] mx-auto p-2 sm:p-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F172A] tracking-tight">Customer Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and respond to feedback on your products.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Summary Stats */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-gray-900 font-bold mb-3 text-[13px]">Overall Rating</h3>
              <p className="text-[40px] font-bold text-gray-900 mb-2 leading-none">4.0</p>
              <RatingStars rating={4} />
              <p className="text-[11px] text-gray-500 mt-2 font-medium">Based on 124 reviews</p>
            </div>
            <div className="mt-8 space-y-3">
              {[
                { stars: 5, pct: 63 },
                { stars: 4, pct: 21 },
                { stars: 3, pct: 10 },
                { stars: 2, pct: 3 },
                { stars: 1, pct: 3 }
              ].map((row) => (
                <div key={row.stars} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 w-6 shrink-0 justify-end">
                    <span className="text-xs font-semibold text-gray-600">{row.stars}</span>
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${row.pct}%` }}></div>
                  </div>
                  <div className="w-8 text-right shrink-0">
                    <span className="text-[11px] font-medium text-gray-600">{row.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-gray-900 font-bold mb-4 text-[13px]">Review Insights</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <MessageCircle size={14} />
                  <span className="text-[12px] font-medium">Total Reviews</span>
                </div>
                <span className="text-[12px] font-bold text-gray-900">124</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <ImageIcon size={14} />
                  <span className="text-[12px] font-medium">With Photos</span>
                </div>
                <span className="text-[12px] font-bold text-gray-900">48 (39%)</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <ShieldCheck size={14} />
                  <span className="text-[12px] font-medium">Verified Buyers</span>
                </div>
                <span className="text-[12px] font-bold text-gray-900">110 (89%)</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Star size={14} />
                  <span className="text-[12px] font-medium">Average Rating</span>
                </div>
                <span className="text-[12px] font-bold text-gray-900">4.0 / 5</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-gray-900 font-bold mb-4 text-[13px]">Rating Trend</h3>
            <div className="relative h-32 w-full mt-4">
              {/* Y Axis Labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400 font-medium z-10">
                <span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
              </div>
              
              {/* Chart Area */}
              <div className="absolute left-4 right-0 top-1.5 bottom-6 border-l border-b border-gray-100">
                {/* Grid Lines */}
                <div className="absolute w-full h-full flex flex-col justify-between">
                  <div className="w-full border-t border-gray-50"></div>
                  <div className="w-full border-t border-gray-50"></div>
                  <div className="w-full border-t border-gray-50"></div>
                  <div className="w-full border-t border-gray-50"></div>
                  <div className="w-full border-t border-gray-50"></div>
                </div>
                
                {/* SVG Graph */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                    points="0,28 12,25 25,23 37,24 50,23 62,24 75,22 87,23 100,23"
                  />
                  <circle cx="0" cy="28" r="1.5" fill="#16A34A" vectorEffect="non-scaling-stroke" />
                  <circle cx="12" cy="25" r="1.5" fill="#16A34A" vectorEffect="non-scaling-stroke" />
                  <circle cx="25" cy="23" r="1.5" fill="#16A34A" vectorEffect="non-scaling-stroke" />
                  <circle cx="37" cy="24" r="1.5" fill="#16A34A" vectorEffect="non-scaling-stroke" />
                  <circle cx="50" cy="23" r="1.5" fill="#16A34A" vectorEffect="non-scaling-stroke" />
                  <circle cx="62" cy="24" r="1.5" fill="#16A34A" vectorEffect="non-scaling-stroke" />
                  <circle cx="75" cy="22" r="1.5" fill="#16A34A" vectorEffect="non-scaling-stroke" />
                  <circle cx="87" cy="23" r="1.5" fill="#16A34A" vectorEffect="non-scaling-stroke" />
                  <circle cx="100" cy="23" r="1.5" fill="#16A34A" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>

              {/* X Axis Labels */}
              <div className="absolute left-4 right-0 bottom-0 flex justify-between text-[9px] text-gray-400 font-medium">
                <span>May 20</span>
                <span>May 27</span>
                <span>Jun 03</span>
                <span>Jun 10</span>
                <span>Jun 17</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 border-b border-gray-100 bg-white">
              <div className="flex gap-4 items-center">
                <span className="font-bold text-gray-900 text-[14px]">All Reviews (124)</span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <select className="w-full appearance-none border border-gray-100 rounded-lg pl-4 pr-10 py-1.5 text-[12px] font-semibold text-gray-600 bg-white focus:outline-none focus:border-gray-200 cursor-pointer shadow-sm">
                    <option>All Ratings</option>
                    <option>5 Stars</option>
                    <option>4 Stars</option>
                    <option>3 Stars</option>
                    <option>1-2 Stars</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative w-full sm:w-auto">
                  <select className="w-full appearance-none border border-gray-100 rounded-lg pl-4 pr-10 py-1.5 text-[12px] font-semibold text-gray-600 bg-white focus:outline-none focus:border-gray-200 cursor-pointer shadow-sm">
                    <option>Newest First</option>
                    <option>Highest Rating</option>
                    <option>Lowest Rating</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 bg-white">
                  <div className="flex gap-4">
                    {/* Customer Avatar */}
                    <div className="w-8 h-8 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center font-semibold text-[13px] shrink-0">
                      {review.customer.initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 text-[13px]">{review.customer.name}</p>
                          <div className="flex items-center gap-2 mt-1 mb-3">
                            <RatingStars rating={review.rating} />
                            <span className="text-[11px] text-gray-400 font-medium">{review.date}</span>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-900 p-1">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>

                      <p className="text-[13px] text-gray-700 leading-relaxed mb-4">{review.comment}</p>

                      <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg p-1.5 mb-4 w-max pr-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <img src={review.product.image} alt={review.product.name} className="w-6 h-6 rounded object-cover" />
                        <span className="text-[11px] font-medium text-gray-700">{review.product.name}</span>
                      </div>

                      {review.reply ? (
                        <div className="bg-[#FAFAFA] border-l-2 border-[#16A34A] p-4 mt-2 mb-4">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Reply size={12} className="text-[#16A34A]" />
                            <span className="text-[11px] font-bold text-gray-900">Your Reply</span>
                          </div>
                          <p className="text-[12px] text-gray-600">{review.reply}</p>
                        </div>
                      ) : replyingTo === review.id ? (
                        <div className="mt-4 mb-4">
                          <textarea
                            autoFocus
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your response to the customer..."
                            className="w-full border border-gray-200 rounded-xl p-3 text-[13px] focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] min-h-[80px] mb-2"
                          ></textarea>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              className="px-3 py-1.5 border border-gray-200 text-gray-600 font-semibold text-[11px] rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReplySubmit(review.id)}
                              disabled={!replyText.trim()}
                              className="px-3 py-1.5 bg-[#16A34A] text-white font-semibold text-[11px] rounded-lg hover:bg-[#15803d] disabled:opacity-50"
                            >
                              Submit Reply
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-5 mt-2">
                        <button className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                          <ThumbsUp size={14} /> Helpful ({review.helpful})
                        </button>
                        {!review.reply && (
                          <button 
                            onClick={() => setReplyingTo(review.id)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-[#16A34A] hover:text-[#15803d] transition-colors"
                          >
                            <Reply size={14} /> Reply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-center bg-white">
              <button className="text-[12px] font-bold text-[#16A34A] hover:text-[#15803d] py-2 px-4 flex items-center gap-1.5">
                Load More Reviews <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
