import React, { useState, useMemo } from "react";
import { useStore } from "../store";
import { FoodItem } from "../types";
import { Search, Star, Clock, Filter, ArrowUpDown, ChevronRight, X, Plus, Minus, Check, Heart, HelpCircle } from "lucide-react";

export default function MenuSection() {
  const { 
    categories, 
    foodItems, 
    activeCategory, 
    setActiveCategory, 
    searchQuery, 
    setSearchQuery, 
    sortBy, 
    setSortBy, 
    addToCart,
    selectedFoodId,
    setSelectedFoodId,
    reviews
  } = useStore();

  // Internal visual filter flags
  const [onlyFeatured, setOnlyFeatured] = useState<boolean>(false);
  const [onlyPopular, setOnlyPopular] = useState<boolean>(false);
  const [priceBudget, setPriceBudget] = useState<number>(30); // Max price budget slider

  // Cart animation helper for specific items
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Popup modal item detail quantities
  const [detailsQty, setDetailsQty] = useState<number>(1);

  // Computed and filtered list
  const filteredFoodItems = useMemo(() => {
    let result = [...foodItems];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query)
      );
    }

    // Filter by Tab Category
    if (activeCategory !== "all") {
      result = result.filter((f) => f.categoryId === activeCategory);
    }

    // Filter by Featured flag
    if (onlyFeatured) {
      result = result.filter((f) => f.isFeatured);
    }

    // Filter by Popular flag
    if (onlyPopular) {
      result = result.filter((f) => f.isPopular);
    }

    // Filter by Price Budget
    result = result.filter((f) => f.price <= priceBudget);

    // Sorting implementation
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "popular") {
      // Prioritize popular items, then keep sorted
      result.sort((a, b) => {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return 0;
      });
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [foodItems, searchQuery, activeCategory, onlyFeatured, onlyPopular, priceBudget, sortBy]);

  // Selected food item calculations for Details Page Modal
  const selectedItem = useMemo(() => {
    return foodItems.find((f) => f.id === selectedFoodId) || null;
  }, [selectedFoodId, foodItems]);

  // Related products suggestion
  const relatedProducts = useMemo(() => {
    if (!selectedItem) return [];
    return foodItems
      .filter((f) => f.categoryId === selectedItem.categoryId && f.id !== selectedItem.id)
      .slice(0, 3);
  }, [selectedItem, foodItems]);

  // Approved reviews for selected item
  const selectedItemReviews = useMemo(() => {
    if (!selectedFoodId) return [];
    return reviews.filter((r) => r.foodItemId === selectedFoodId && r.isApproved);
  }, [selectedFoodId, reviews]);

  const handleAddToCartClick = (e: React.MouseEvent, item: FoodItem, qty = 1) => {
    e.stopPropagation(); // Avoid opening dialog on card click
    addToCart(item, qty);
    setJustAddedId(item.id);
    setTimeout(() => setJustAddedId(null), 1500);
  };

  const handleAddFromDetails = () => {
    if (selectedItem) {
      addToCart(selectedItem, detailsQty);
      setJustAddedId(selectedItem.id);
      setTimeout(() => setJustAddedId(null), 1500);
      setSelectedFoodId(null); // Close modal
      setDetailsQty(1); // Reset
    }
  };

  // Static fallback ingredients dictionary on names to look premium and authentic
  const getIngredients = (foodName: string): string[] => {
    const list = [
      "Farm Fresh Local Ingredients",
      "Organic Vegetables",
      "Extra Virgin Olive Oil",
      "Sea Salt & Coarse Pepper",
      "Our Secret House Seasoning"
    ];
    if (foodName.includes("Pancake")) return ["Fresh Buttermilk", "Organic Wheat Flour", "Fresh Eggs", "Canadian Maple Syrup", "Fresh Strawberries & Blueberries"];
    if (foodName.includes("Toast")) return ["Organic Avocados", "Fresh Country Sourdough Bread", "Free-Range Poached Egg", "Whipped Rich Cream Cheese", "Cracked Chili Flakes"];
    if (foodName.includes("Burger")) return ["Premium Hand-Breaded Chicken Breast", "Artisanal Brioche Toast", "Spicy Buffalo Herb Glaze", "Handmade Garlic Aioli sauce", "Fresh Butter Lettuce & Pickle Silvers"];
    if (foodName.includes("Salad")) return ["Crisp Romaine Greens", "Aged Greek Sheep Feta", "Organic Ruby Vine Tomatoes", "Greek Kalamata Olives", "Virgin Olive Vinaigrette Dressing"];
    if (foodName.includes("Steak")) return ["Premium Grain-Fed Ribeye (12oz)", "Homemade Garlic Asparagus", "Yukon Gold Mashed Potatoes", "Clarified Herb Butter Glaze"];
    if (foodName.includes("Pizza")) return ["Rustic Hand-Stretched Sourdough", "Premium Sliced Pepperoni Logs", "Rich Whole-Milk shredded Mozzarella", "Local slow-simmered marinara sauce"];
    return list;
  };

  return (
    <section className="py-8" id="menu-section-wrapper">
      
      {/* Category Tabs Header Zone - Large Buttons & Labels for low tech literacy */}
      <div className="bg-stone-100 p-2.5 rounded-2xl border border-stone-200 mb-8 shadow-sm">
        <label className="block text-xs font-mono font-bold tracking-widest text-stone-500 uppercase mb-2 text-center">
          ⚡ Select Category Below To Order
        </label>
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
              activeCategory === "all"
                ? "bg-stone-900 text-white shadow-md scale-105"
                : "bg-white hover:bg-stone-200 text-stone-850 hover:text-stone-950"
            }`}
          >
            All Items ({foodItems.length})
          </button>
          {categories.map((cat) => {
            const count = foodItems.filter((f) => f.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-3 rounded-xl text-sm font-bold transition duration-150 cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-stone-900 text-white shadow-md scale-105"
                    : "bg-white hover:bg-stone-200 text-stone-850"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between border-b border-stone-150 pb-3">
              <span className="font-bold font-sans text-stone-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-600" /> Filter & Sort
              </span>
              <button
                type="button" 
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                  setOnlyFeatured(false);
                  setOnlyPopular(false);
                  setPriceBudget(30);
                  setSortBy("popular");
                }}
                className="text-xs text-amber-700 font-bold hover:underline cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Price Budget Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-stone-600 font-bold">
                <span>Maximum Price Budget:</span>
                <span className="font-mono text-amber-700 text-sm font-black">${priceBudget.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="3"
                max="30"
                step="0.5"
                value={priceBudget}
                onChange={(e) => setPriceBudget(Number(e.target.value))}
                className="w-full accent-amber-600 h-2 bg-stone-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>Min: $3.00</span>
                <span>Max: $30.00</span>
              </div>
            </div>

            {/* Extra flags Switches */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100 transition">
                <input
                  type="checkbox"
                  checked={onlyFeatured}
                  onChange={(e) => setOnlyFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-sm font-bold text-stone-800 block">Featured Selection</span>
                  <span className="text-[10px] text-stone-500 block">Issa's recommended dishes</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100 transition">
                <input
                  type="checkbox"
                  checked={onlyPopular}
                  onChange={(e) => setOnlyPopular(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-sm font-bold text-stone-800 block">Most Popular Dishes</span>
                  <span className="text-[10px] text-stone-500 block">Highly liked by other customers</span>
                </div>
              </label>
            </div>

            {/* Sorting Order Segment */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" /> Sort Results By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm font-semibold text-stone-850 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="popular">Recommended Hits</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newly Added</option>
              </select>
            </div>

          </div>
        </div>

        {/* Content Zone (Search and Foods Grid) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Dynamic Interactive Live Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search dishes instantly... (e.g. pancakes, burger, ribeye, cheesecake)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-2xl pl-12 pr-4 py-3.5 text-stone-850 placeholder-stone-450 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-sm transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-stone-500 absolute right-4 top-4 hover:text-stone-800 border-l border-stone-200 pl-3.5 cursor-pointer font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Results Info Bar */}
          <div className="flex justify-between items-center text-xs text-stone-500 font-mono bg-stone-50 p-2.5 rounded-xl border border-stone-200">
            <span>Found {filteredFoodItems.length} mouth-watering options</span>
            {searchQuery && <span>Matching keyword: "{searchQuery}"</span>}
          </div>

          {/* Grid Layout of Items */}
          {filteredFoodItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFoodItems.map((item) => {
                const isAdded = justAddedId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => { setSelectedFoodId(item.id); setDetailsQty(1); }}
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col cursor-pointer group"
                  >
                    
                    {/* Visual Aspect Ratio Image */}
                    <div className="relative aspect-video bg-stone-100 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      
                      {/* Top Badges overlay */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                        {item.isFeatured && (
                          <span className="bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow">
                            Our Best
                          </span>
                        )}
                        {item.isPopular && (
                          <span className="bg-stone-900 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow flex items-center gap-0.5">
                            🔥 Popular
                          </span>
                        )}
                      </div>

                      {/* Bottom Prep Indicator overlay */}
                      <div className="absolute bottom-2.5 right-2.5 bg-stone-900/80 text-white text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-md shadow backdrop-blur-xs flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{item.preparationTime} Mins</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-[11px] text-amber-700 font-black uppercase tracking-widest font-mono">
                          {categories.find((c) => c.id === item.categoryId)?.name || "Dish"}
                        </div>
                        <h3 className="text-base font-bold text-stone-900 tracking-tight font-sans group-hover:text-amber-800 transition">
                          {item.name}
                        </h3>
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Price Tag & Action */}
                      <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold block uppercase -mb-0.5">Price</span>
                          <span className="text-xl font-extrabold text-stone-900 font-sans tracking-tight">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>

                        {/* Large, clear, highly clickable Add Button */}
                        <button
                          type="button"
                          onClick={(e) => handleAddToCartClick(e, item)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                            isAdded
                              ? "bg-green-600 text-white scale-105"
                              : "bg-amber-600 hover:bg-amber-700 text-white"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 px-0.5" /> Added!
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> Order
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-12 text-center max-w-lg mx-auto">
              <p className="text-stone-400 font-black text-xl mb-2">No Matching Foods Found</p>
              <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                We couldn't locate any dishes matching your query or budget of <strong className="text-amber-800">${priceBudget}</strong>. Try clearing your filters or look for something else!
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                  setOnlyFeatured(false);
                  setOnlyPopular(false);
                  setPriceBudget(30);
                }}
                className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-5 py-3 rounded-xl cursor-pointer"
              >
                Show All Dishes
              </button>
            </div>
          )}

        </div>
      </div>

      {/* DETAIL MODAL / SINGLE DISH POPUP PAGE (WCAG compliant high-contrast card) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden w-full max-w-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button Trigger */}
            <button
              onClick={() => setSelectedFoodId(null)}
              className="absolute top-4 right-4 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full p-2.5 shadow-md hover:scale-105 transition transition-transform z-20 cursor-pointer"
              title="Close Details"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Product Visual Gallery (Left) */}
              <div className="relative aspect-square md:aspect-auto md:h-full bg-stone-100 min-h-64">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex gap-1.5 flex-col">
                  {selectedItem.isFeatured && (
                    <span className="bg-amber-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-md shadow">
                      Featured Recommended
                    </span>
                  )}
                  {selectedItem.isPopular && (
                    <span className="bg-stone-900 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-md shadow">
                      🔥 Most Popular
                    </span>
                  )}
                </div>
              </div>

              {/* Product Detailed Spec (Right) */}
              <div className="p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-amber-700 font-black uppercase tracking-widest font-mono">
                    {categories.find((c) => c.slug === selectedItem.categoryId || c.id === selectedItem.categoryId)?.name || "Restaurant Food"}
                  </span>
                  
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight font-sans mt-1">
                    {selectedItem.name}
                  </h2>
                  
                  <div className="flex items-center gap-4 text-xs font-mono font-bold text-stone-500 py-3 my-2 border-y border-stone-150">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Prep: {selectedItem.preparationTime} Mins
                    </span>
                    <span className="flex items-center gap-1 text-green-700 border-l border-stone-200 pl-4">
                      ● Prepared Fresh
                    </span>
                  </div>

                  <p className="text-sm text-stone-600 leading-relaxed pt-2">
                    {selectedItem.description}
                  </p>

                  {/* Complete Ingredients List Section */}
                  <div className="mt-4 space-y-1.5">
                    <span className="text-xs font-black text-stone-900 uppercase tracking-wider block">
                      Ingredients Inside
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {getIngredients(selectedItem.name).map((ing, i) => (
                        <span key={i} className="bg-stone-100 border border-stone-200 text-stone-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price, Action Quantities */}
                <div className="pt-6 mt-6 border-t border-stone-150">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <span className="text-xs text-stone-450 uppercase block font-bold">Total Price</span>
                      <span className="text-2xl font-black text-stone-900 font-sans tracking-tight">
                        ${(selectedItem.price * detailsQty).toFixed(2)}
                      </span>
                    </div>

                    {/* Highly accessible large quantity controls */}
                    <div className="flex items-center bg-stone-100 rounded-xl border border-stone-300 p-1">
                      <button
                        onClick={() => detailsQty > 1 && setDetailsQty(detailsQty - 1)}
                        className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                        title="Reduce Quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 font-black font-sans text-stone-900 text-base">
                        {detailsQty}
                      </span>
                      <button
                        onClick={() => setDetailsQty(detailsQty + 1)}
                        className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                        title="Increase Quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddFromDetails}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase transition flex items-center justify-center gap-2 shadow cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add To Kitchen Order List
                  </button>
                </div>

              </div>

            </div>

            {/* Related Products Footer Panel inside Popup */}
            {relatedProducts.length > 0 && (
              <div className="bg-stone-50 p-6 md:p-8 border-t border-stone-150">
                <h3 className="text-sm font-black text-stone-950 uppercase tracking-widest mb-4">
                  😋 Frequently Ordered Together
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedProducts.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => { setSelectedFoodId(rel.id); setDetailsQty(1); }}
                      className="bg-white border border-stone-200 p-3 rounded-xl flex items-center gap-3 hover:border-amber-500 cursor-pointer transition"
                    >
                      <img
                        src={rel.image}
                        alt={rel.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 truncate">{rel.name}</h4>
                        <p className="text-xs font-black text-amber-700 font-mono">${rel.price.toFixed(2)}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews display under product within modal */}
            {selectedItemReviews.length > 0 && (
              <div className="p-6 md:p-8 border-t border-stone-150 bg-amber-50/50">
                <h3 className="text-sm font-black text-stone-950 uppercase tracking-widest mb-4">
                  ⭐ Customer Reviews for this Dish
                </h3>
                <div className="space-y-3.5">
                  {selectedItemReviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-4 rounded-xl border border-stone-150 text-left">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-extrabold text-stone-900">{rev.customerName}</span>
                        <div className="flex gap-0.5 text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-stone-600 leading-normal italic">
                        "{rev.review}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </section>
  );
}
