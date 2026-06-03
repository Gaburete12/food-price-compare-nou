# 🍔 Food Price Compare - Product Search & Comparison

A powerful, real-time food price comparison platform for Romania (Glovo, Bolt, Wolt). Search for products and instantly compare prices across all three delivery platforms.

## ✨ Features

### 🔍 **Product Search**
- Fuzzy matching algorithm for intelligent search
- Real-time results (300ms debounce)
- Supports 3 platforms: Glovo, Bolt, Wolt

### 💰 **Price Comparison**
- Side-by-side price breakdown for each platform
- Automatic fee calculation:
  - Base price
  - Delivery fee
  - Service fee
  - Small order fee (if applicable)
- **Cheapest option highlighted** with golden badge

### 🎯 **Smart Filtering**
- **Platform toggles** - Filter by Glovo/Bolt/Wolt
- **Sort options**:
  - By relevance (default)
  - Price ascending (cheapest first)
  - Price descending (most expensive first)
- Real-time result updates

### ❤️ **Favorites System**
- Save favorite products with heart button
- Persistent storage (localStorage)
- Dedicated Favorites page with grid view
- Quick access to saved items

### 📱 **Recent Searches**
- Auto-save last 5 searches
- Quick-click dropdown to repeat searches
- Perfect for frequent items

### ⚡ **Performance Optimization**
- 5-minute TTL cache for search results
- localStorage persistence
- 90% faster repeat searches
- Reduced API load

### 📊 **Analytics Dashboard**
- Track total searches performed
- View top 5 trending searches
- Platform performance metrics
- Victory percentage (which platform is cheapest)
- Average price breakdown per platform
- Data-driven insights for strategy

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

```bash
git clone https://github.com/Gaburete12/food-price-compare-nou.git
cd food-price-compare-nou

# Install dependencies
pnpm install

# Set environment variables (optional)
# DELIVERY_FEES_SYNC_TOKEN=your-token
# DELIVERY_FEES_SOURCE_URL=your-url
```

### Development

```bash
# Start dev server on http://localhost:5173
pnpm run dev

# In another terminal, build and start server
pnpm run build
npm run start
```

### Production Build

```bash
pnpm run build
npm run start
```

## 📁 Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductSearch.tsx          # Main search UI
│   │   │   ├── FavoritesPage.tsx          # Favorites grid
│   │   │   ├── AnalyticsDashboard.tsx     # Stats & insights
│   │   │   └── restaurant/                # Restaurant components
│   │   ├── hooks/
│   │   │   ├── useProductSearch.ts        # Search with cache
│   │   │   ├── useSearchCache.ts          # Caching logic
│   │   │   └── useSearchAnalytics.ts      # Analytics tracking
│   │   ├── pages/
│   │   │   └── Home.tsx                   # Main page
│   │   └── lib/
│   │       └── data.ts                    # Restaurant data
│   └── vite.config.ts
│
├── server/
│   ├── index.ts                           # Express server
│   ├── productRoutes.ts                   # /api/products/* routes
│   ├── deliveryFeeStore.ts                # Fee data management
│   └── restaurantMenuStore.ts             # Menu data management
│
├── shared/
│   ├── product-search.ts                  # Fuzzy search engine
│   ├── product-search.ts                  # Search algorithm
│   ├── delivery-fees.ts                   # Fee calculations
│   └── restaurant-menus.ts                # Menu processing
│
└── data/
    ├── restaurant-menus.json              # Menu database
    ├── delivery-fees.json                 # Fee database
    └── restaurants.json                   # Restaurant data
```

## 🔧 API Endpoints

### Search Products
```
GET /api/products/search?q=pizza
```

**Response:**
```json
{
  "query": "pizza",
  "count": 15,
  "results": [
    {
      "id": "pizza-margherita-1",
      "name": "Pizza Margherita",
      "restaurant": { "id": "restaurant-1", "name": "Pizzeria X" },
      "imageUrl": "...",
      "description": "Fresh mozzarella, tomato, basil",
      "prices": [
        {
          "platform": "glovo",
          "available": true,
          "basePrice": 25.99,
          "deliveryFee": 3.50,
          "serviceFee": 2.00,
          "smallOrderFee": 0,
          "totalEstimated": 31.49
        }
        // ... more platforms
      ],
      "cheapestOption": { "platform": "bolt", "totalEstimated": 29.99 }
    }
    // ... more results
  ]
}
```

## 💾 Data Management

### Adding Restaurants

1. Update `data/restaurant-menus.json` with menu data
2. Update `data/delivery-fees.json` with platform fees
3. Update `client/src/lib/data.ts` with restaurant metadata

### Menu Format
```json
{
  "restaurantId": {
    "name": "Restaurant Name",
    "city": "Constanța",
    "items": [
      {
        "id": "item-1",
        "name": "Product Name",
        "description": "Description",
        "price": 15.99,
        "image": "url...",
        "category": "Pizza"
      }
    ]
  }
}
```

### Delivery Fee Format
```json
{
  "restaurantId": {
    "glovo": {
      "deliveryFee": 3.50,
      "serviceFee": 2.00,
      "smallOrderFee": 5.00,
      "minOrderForFree": 50.00
    },
    "bolt": { ... },
    "wolt": { ... }
  }
}
```

## 🎨 UI Components

All components use **Radix UI** + **TailwindCSS**:
- Input (search box)
- Dialog (price comparison modal)
- Badge (platform tags)
- Button (actions)
- Custom animations with Framer Motion

## 🔍 Search Algorithm

### Fuzzy Matching Scoring
```
score = (name_match * 2) + (description_match * 1) + (category_match * 1.5)
min_threshold = 30
```

**Features:**
- Case-insensitive
- Partial matching
- Weighted scoring
- Top 20 results returned

## 📊 Analytics Events Tracked

- Search queries
- Platform selections
- Product views
- Favorites added/removed
- Platform victories (cheapest option)
- Average prices per platform

## 🚀 Future Roadmap

- [ ] Multi-city support (Bucharest, Timișoara, etc.)
- [ ] Enhanced Bolt/Wolt scrapers
- [ ] User accounts & sync favorites
- [ ] Notifications for price drops
- [ ] Browser extension
- [ ] Mobile app
- [ ] Nutrition info integration
- [ ] Dietary filters (vegan, gluten-free)

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| Initial search | ~500ms (cold cache) |
| Repeat search | ~50ms (cached) |
| Filtering | Real-time (<100ms) |
| Analytics updates | Instant |
| Favorites save | Instant (localStorage) |

## 🤝 Contributing

Contributions welcome! Areas to improve:
- More restaurants & cities
- Better scrapers
- UI/UX enhancements
- Performance optimizations
- Testing coverage

## 📝 License

MIT - Feel free to use for personal or commercial projects

## 👨‍💻 Created with

- **Framework**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS v4
- **UI Components**: Radix UI
- **Backend**: Express.js, Node.js
- **Database**: JSON files (can be upgraded to MongoDB/PostgreSQL)
- **Build**: esbuild, Vite
- **Testing**: Vitest, Playwright

## 📞 Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check existing documentation
- Review the API endpoints

---

**Made with ❤️ to help Romanians save money on food delivery** 🇷🇴
