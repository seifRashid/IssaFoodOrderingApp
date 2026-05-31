import React, { useState, useMemo } from "react";
import { StoreProvider, useStore } from "./store";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MenuSection from "./components/MenuSection";
import CheckoutSection from "./components/CheckoutSection";
import ActiveOrderTracking from "./components/ActiveOrderTracking";
import CustomerDashboard from "./components/CustomerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { 
  ChefHat, Clock, Compass, Activity, ArrowRight, ShieldCheck, 
  MapPin, Star, Sparkles, MessageCircle, AlertCircle, ShoppingBag 
} from "lucide-react";

function AppContent() {
  const { 
    activeTab, 
    setActiveTab, 
    setActiveCategory, 
    categories, 
    foodItems, 
    reviews, 
    orders,
    submitReview,
    isActionLoading 
  } = useStore();

  // Testimonial cards state
  const testimonials = [
    { name: "Amina Omondi", role: "Resident, Kilimani", text: "Issa Kitchen is my daily go-to breakfast. Getting avocado toast delivered hot in under 15 minutes is a game changer for my morning schedule!", rating: 5 },
    { name: "Michael Mwangi", role: "Office Manager, Westlands", text: "The crispy spicy burger is legendary! Our office orders in bulk every Friday. Extremely simple interface, my staff places orders effortlessly.", rating: 5 },
    { name: "Fatma Hassan", role: "Senior Citizen, South C", text: "I have difficulty typing on small smartphone keys, but the big, high-contrast buttons on Issa Kitchen let me order warm soup with just three taps.", rating: 5 }
  ];

  // Leave a review form state
  const [revFoodId, setRevFoodId] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [revText, setRevText] = useState("");
  const [revAIStatus, setRevAIStatus] = useState<string | null>(null);
  const [revSuccess, setRevSuccess] = useState(false);

  const popularDishes = useMemo(() => {
    return foodItems.filter(f => f.isPopular).slice(0, 3);
  }, [foodItems]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revFoodId || !revText.trim()) {
      alert("Please select a dish and write your feedback text.");
      return;
    }
    const matchedFood = foodItems.find(f => f.id === revFoodId);
    const foodName = matchedFood ? matchedFood.name : "Selected Dish";

    const res = await submitReview(revFoodId, foodName, revRating, revText);
    if (res && res.review) {
      setRevAIStatus(res.aiStatus || "Auto-Moderator Finished");
      setRevSuccess(true);
      // Reset form fields
      setRevText("");
      setRevFoodId("");
      
      // Clear notification success after time
      setTimeout(() => {
        setRevSuccess(false);
        setRevAIStatus(null);
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between font-sans text-stone-900" id="application-layout">
      
      {/* Dynamic Header Navigation */}
      <Header />

      {/* Main Screen Router layout container */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        
        {/* ==========================================
            TAB: HOME (Landing Page / Hero Context)
            ========================================== */}
        {activeTab === "home" && (
          <div className="space-y-16 py-4 text-center sm:text-left" id="home-view">
            
            {/* Elegant Hero Segment */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-stone-900 text-stone-100 rounded-3xl overflow-hidden p-6 sm:p-12 border border-stone-850 shadow-xl relative min-h-[480px]">
              
              {/* Backglow overlay for beautiful warmth ambiance */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              <div className="md:col-span-7 space-y-6 z-10">
                <div className="inline-flex items-center gap-1.5 bg-amber-600/20 text-amber-400 font-mono text-[10px] sm:text-xs px-3.5 py-1.5 rounded-full font-black uppercase tracking-widest border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5" /> Handcrafted Premium Local Dining
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-sans tracking-tight text-white leading-none">
                  Made Fresh. <br />
                  <span className="text-amber-500">Served Burning Hot.</span> <br />
                  Delivered Speedy.
                </h1>

                <p className="text-sm sm:text-base text-stone-300 max-w-lg leading-relaxed">
                  Welcome to Issa Kitchen. We craft authentic, organic local foods that heal the soul. Simple, high-contrast menus built for extreme ease of use for tech-savvy youngsters and retired elders alike.
                </p>

                {/* Highly clickable massive buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab("menu")}
                    className="bg-amber-600 hover:bg-amber-700 hover:scale-103 active:scale-[0.98] transition text-white font-black text-xs uppercase px-8 py-4.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-amber-500"
                  >
                    <span>Order Hot Meal Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { setActiveTab("menu"); setActiveCategory("all"); }}
                    className="bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white font-bold text-xs uppercase px-7 py-4.5 rounded-2xl cursor-pointer border border-stone-700/60 transition"
                  >
                    View Restaurant Menu
                  </button>
                </div>
              </div>

              {/* Graphic Banner Panel (Right 5 Columns) */}
              <div className="md:col-span-5 h-72 sm:h-96 rounded-2xl overflow-hidden shadow-2xl relative border border-stone-700 bg-stone-800">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800"
                  alt="Mouth-watering warm meal collection"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex items-end p-5">
                  <div className="flex items-center gap-3 bg-stone-900/90 text-white p-3.5 rounded-xl border border-stone-755/90 backdrop-blur-xs leading-none">
                    <Clock className="w-8 h-8 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-amber-400 block font-bold uppercase tracking-wider font-mono">Kitchen Speed</span>
                      <strong className="text-sm font-black block mt-1 tracking-wide">Rider Delivery in 15m</strong>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Why Choose us section */}
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-xs font-black tracking-widest text-amber-700 uppercase font-mono">Our Quality Shield</span>
                <h2 className="text-3xl font-black text-stone-900 tracking-tight font-sans">Why Issa Kitchen?</h2>
                <p className="text-sm text-stone-500">We stand by local farmers, fresh ingredients, and extreme layout ease.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* fresh ingredients */}
                <div className="bg-white p-6 rounded-2xl border border-stone-250 shadow-sm space-y-3 hover:scale-[1.01] transition duration-200">
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-xl w-max">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-stone-900 tracking-tight text-base">Fresh Ingredients</h3>
                  <p className="text-xs text-stone-550 leading-relaxed">
                    Organic greens, local vine-ripened tomatoes, and pasture-raised eggs sourced fresh every dawn from nearby farms.
                  </p>
                </div>

                {/* fast delivery */}
                <div className="bg-white p-6 rounded-2xl border border-stone-250 shadow-sm space-y-3 hover:scale-[1.01] transition duration-200">
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl w-max">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-stone-900 tracking-tight text-base">Lightning Fast Rider</h3>
                  <p className="text-xs text-stone-550 leading-relaxed">
                    Once packed golden and wrapped, our swift motorcycle couriers navigate side streets to hand you hot meals in minutes.
                  </p>
                </div>

                {/* affordable */}
                <div className="bg-white p-6 rounded-2xl border border-stone-250 shadow-sm space-y-3 hover:scale-[1.01] transition duration-200">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-xl w-max">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-stone-900 tracking-tight text-base">Affordable Pricing</h3>
                  <p className="text-xs text-stone-550 leading-relaxed">
                    We keep overhead low and structure fair price points so everyone in Lake Estates can enjoy top chef cooking daily.
                  </p>
                </div>

                {/* accessibility */}
                <div className="bg-white p-6 rounded-2xl border border-stone-250 shadow-sm space-y-3 hover:scale-[1.01] transition duration-200">
                  <div className="p-3 bg-purple-50 text-purple-700 rounded-xl w-max">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-stone-900 tracking-tight text-base">Supreme Accessibility</h3>
                  <p className="text-xs text-stone-550 leading-relaxed">
                    Extra-large text fonts, minimum touch target fields, and 1-click reorder workflows built for maximum ease of use.
                  </p>
                </div>

              </div>
            </div>

            {/* Popular dishes teasers */}
            {popularDishes.length > 0 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-left space-y-1">
                    <span className="text-xs font-black text-amber-700 font-mono tracking-widest uppercase">Popular Hits</span>
                    <h2 className="text-2xl font-black text-stone-900 tracking-tight font-sans">Most Ordered Dishes This Week</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("menu")}
                    className="text-xs text-amber-700 font-black hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    Browse full restaurant menu <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {popularDishes.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => setActiveTab("menu")}
                      className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] cursor-pointer transition flex flex-col justify-between text-left"
                    >
                      <div className="aspect-video relative bg-stone-100">
                        <img src={dish.image} alt={dish.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        <span className="absolute top-2.5 left-2.5 bg-stone-900 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                          🔥 Hot Popular
                        </span>
                      </div>
                      <div className="p-4 space-y-1.5 flex-grow">
                        <h3 className="font-bold text-stone-900 tracking-tight text-sm truncate">{dish.name}</h3>
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{dish.description}</p>
                      </div>
                      <div className="p-4 pt-0 border-t border-stone-105 mt-2 flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-stone-900">${dish.price.toFixed(2)}</span>
                        <span className="text-[10px] text-amber-700 font-bold">Details ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular categories banner selector */}
            <div className="bg-stone-100 p-8 sm:p-10 rounded-2xl border border-stone-200 text-center space-y-6">
              <div className="max-w-md mx-auto space-y-2">
                <span className="text-[10px] text-amber-800 font-black uppercase font-mono tracking-widest">Uber Eats Style Experience</span>
                <h3 className="text-2xl font-black text-stone-900 tracking-tight">Craving a specific recipe?</h3>
                <p className="text-xs text-stone-500">Pick any of our preloaded hot category options to explore instantly.</p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setActiveTab("menu"); }}
                    className="bg-white hover:bg-stone-250 border border-stone-200 px-5 py-3 rounded-xl hover:scale-105 text-stone-850 text-xs font-extrabold cursor-pointer transition shadow-sm"
                  >
                    {cat.name} Collection
                  </button>
                ))}
              </div>
            </div>

            {/* Testimonials Segment */}
            <div className="space-y-6 pb-4">
              <div className="text-center max-w-xs mx-auto">
                <span className="text-xs font-black text-amber-700 tracking-widest uppercase font-mono">Rave Reviews</span>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight font-sans mt-0.5">What Customers Say</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((test, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-stone-250 shadow-sm space-y-3.5 text-left flex flex-col justify-between">
                    <p className="text-xs text-stone-605 leading-relaxed italic">
                      "{test.text}"
                    </p>
                    <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
                      <div>
                        <strong className="text-xs font-bold text-stone-900 block">{test.name}</strong>
                        <span className="text-[10px] text-stone-400 block">{test.role}</span>
                      </div>
                      <div className="flex gap-0.5 text-amber-500">
                        {Array.from({ length: test.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB: MENU (Brings core catalog explorer)
            ========================================== */}
        {activeTab === "menu" && <MenuSection />}

        {/* ==========================================
            TAB: REVIEWS (Dedicated public review board & write panel)
            ========================================== */}
        {activeTab === "reviews" && (
          <div className="space-y-8 text-left max-w-4xl mx-auto" id="reviews-view font-sans">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight font-sans">
                  Public Feedback Portal
                </h2>
                <span className="text-xs text-stone-500">
                  Read safe customer testimonials of Issa dishes, or leave your own rating!
                </span>
              </div>
              
              <div className="bg-stone-105 px-3 py-1.5 rounded-lg border border-stone-200 text-[10px] text-stone-500 font-mono font-bold uppercase">
                ⚙️ Gemini AI Auto-Moderator Active
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Write review form block (Left 5 Columns) */}
              <div className="md:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <span className="text-xs font-black uppercase tracking-wider block text-stone-900 border-b border-stone-100 pb-2">
                  🎙️ Leave Chef Feedback
                </span>

                {revSuccess && (
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 space-y-1">
                    <strong className="block text-amber-800 font-black">✓ Review Submitted</strong>
                    <p className="text-[11px] leading-snug">
                      Your feedback has been analyzed. Status: <strong className="font-mono text-[10px]">{revAIStatus}</strong>
                    </p>
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-600 font-bold block">1. Select Ordered Plate *</label>
                    <select
                      value={revFoodId}
                      required
                      onChange={(e) => setRevFoodId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none"
                    >
                      <option value="">-- Choose item --</option>
                      {foodItems.map(f => (
                        <option key={f.id} value={f.id}>{f.name} - ${f.price.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-600 font-bold block">2. Star Score Rating *</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRevRating(star)}
                          className="focus:outline-none hover:scale-115 transition"
                          title={`${star} Stars`}
                        >
                          <Star className={`w-6 h-6 px-0.5 cursor-pointer ${
                            revRating >= star ? "text-amber-500 fill-amber-500" : "text-stone-300"
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-600 font-bold block">3. Review Comment Text *</label>
                    <textarea
                      placeholder="e.g. Incredibly fresh, hot pancakes! Spiciness was ideal!"
                      value={revText}
                      required
                      onChange={(e) => setRevText(e.target.value)}
                      rows={3}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none placeholder-stone-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] tracking-wider uppercase py-3 rounded-xl transition cursor-pointer"
                  >
                    {isActionLoading ? "Running AI Filter..." : "Post Review to Catalog"}
                  </button>

                  <p className="text-[10px] text-stone-400 text-center leading-normal italic">
                    *Content gets analyzed via Gemini Flash for safety, immediately rejecting or flagging spam reviews.
                  </p>

                </form>
              </div>

              {/* Display public reviews (Right 7 Columns) */}
              <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <span className="text-xs font-black uppercase tracking-wider block text-stone-900 border-b border-stone-100 pb-2">
                  📝 Approved Public Review Logs
                </span>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 divide-y divide-stone-150">
                  {reviews.filter(r => r.isApproved).length > 0 ? (
                    reviews.filter(r => r.isApproved).map((rev) => (
                      <div key={rev.id} className="pt-4 first:pt-0 pb-1 text-left space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <strong className="text-stone-900 font-extrabold">{rev.customerName}</strong>
                            <span className="text-stone-405 font-mono text-[10px] ml-2 font-semibold bg-stone-100 px-1.5 py-0.5 rounded uppercase">
                              On: {rev.foodItemName}
                            </span>
                          </div>
                          <div className="flex gap-0.5 text-amber-500">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-stone-605 leading-relaxed italic pl-2 border-l-2 border-stone-150">
                          "{rev.review}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-stone-400 italic">
                      Awaiting approved customers review write-ups to list on card indexes.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB: CHECKOUT (Gathers buyer address payload)
            ========================================== */}
        {activeTab === "checkout" && <CheckoutSection />}

        {/* ==========================================
            TAB: TRACK-ORDER (Uber-Eats style timeline progress)
            ========================================== */}
        {activeTab === "track-order" && <ActiveOrderTracking />}

        {/* ==========================================
            TAB: DASHBOARD (Simple Customer overview)
            ========================================== */}
        {activeTab === "dashboard" && <CustomerDashboard />}

        {/* ==========================================
            TAB: ADMIN-DASHBOARD (Managers full ledger platform)
            ========================================== */}
        {activeTab === "admin-dashboard" && <AdminDashboard />}

      </main>

      {/* Dynamic persistent bottom order tracking indicator floating drawer */}
      {activeTab !== "track-order" && activeTab !== "admin-dashboard" && orders.some(o => o.status !== "Delivered" && o.status !== "Cancelled") && (
        <div className="bg-amber-950 text-white py-3.5 px-6 sticky bottom-0 z-30 border-t border-amber-900 flex justify-between items-center shadow-2xl animate-bounce">
          <div className="flex items-center gap-3 text-left">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <div>
              <span className="text-[10px] text-amber-400 font-mono font-bold block uppercase tracking-wider leading-none">Rider Active In Route</span>
              <strong className="text-xs font-bold block mt-1">Your hot order is getting processed!</strong>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("track-order")}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider cursor-pointer"
          >
            Track progress
          </button>
        </div>
      )}

      {/* Footer support credits info */}
      <Footer />

    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
