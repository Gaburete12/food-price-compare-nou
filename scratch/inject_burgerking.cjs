const fs = require('fs');
const path = require('path');

const menusFilePath = path.join(__dirname, '..', 'data', 'restaurant-menus.json');
const raw = fs.readFileSync(menusFilePath, 'utf8');
const cleanJson = raw.trim().replace(/^\uFEFF/, "");
const data = JSON.parse(cleanJson);

const burgerKingMenu = [
  {
    id: "bk-meniu-whopper",
    name: "Meniu Whopper",
    description: "Whopper Burger preparat pe grătar 270g, o porție medie de cartofi prăjiți 114g și o băutură răcoritoare la alegere 500ml",
    category: "Meniuri",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 38.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-meniu-double-whopper",
    name: "Meniu Double Whopper",
    description: "Double Whopper Burger preparat pe grătar 370g, o porție medie de cartofi prăjiți 114g și o băutură răcoritoare la alegere 500ml",
    category: "Meniuri",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 44.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-meniu-steakhouse",
    name: "Meniu Steakhouse",
    description: "Steakhouse Burger 310g cu bacon și sos BBQ, o porție medie de cartofi prăjiți 114g și o băutură răcoritoare la alegere 500ml",
    category: "Meniuri",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 43.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-meniu-big-king",
    name: "Meniu Big King",
    description: "Big King Burger 190g cu sosul secret King, o porție medie de cartofi prăjiți 114g și o băutură răcoritoare la alegere 500ml",
    category: "Meniuri",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 35.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-whopper",
    name: "Whopper Burger",
    description: "Burger de vită preparat pe grătar, roșii proaspete, salată, maioneză, ketchup, castraveți murați și ceapă pe chiflă cu susan 270g",
    category: "Burgeri",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 26.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-double-whopper",
    name: "Double Whopper Burger",
    description: "Două bucăți de carne de vită preparate pe grătar, roșii, salată, maioneză, ketchup, castraveți murați și ceapă 370g",
    category: "Burgeri",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 32.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-steakhouse",
    name: "Steakhouse Burger",
    description: "Burger din carne de vită preparat pe grătar, bacon crocant, ceapă prăjită, sos BBQ, maioneză, salată și roșii 310g",
    category: "Burgeri",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 31.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-big-king",
    name: "Big King Burger",
    description: "Două bucăți de carne de vită, sos King, salată, brânză topită Cheddar, castraveți murați și ceapă 190g",
    category: "Burgeri",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 23.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-cartofi-prajiți-medie",
    name: "Cartofi Prăjiți (Medie)",
    description: "Porție medie de cartofi prăjiți crocanți, calzi și sărați 114g",
    category: "Cartofi și sosuri",
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 9.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-cartofi-prajiți-mare",
    name: "Cartofi Prăjiți (Mare)",
    description: "Porție mare de cartofi prăjiți crocanți, calzi și sărați 150g",
    category: "Cartofi și sosuri",
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 11.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-coca-cola-500ml",
    name: "Coca-Cola 500ml",
    description: "Băutură răcoritoare carbogazoasă cu gust de cola 500ml",
    category: "Băuturi",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 8.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-fanta-500ml",
    name: "Fanta Portocale 500ml",
    description: "Băutură răcoritoare carbogazoasă cu gust de portocale 500ml",
    category: "Băuturi",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 8.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-sprite-500ml",
    name: "Sprite 500ml",
    description: "Băutură răcoritoare carbogazoasă cu gust de lămâie și lămâie verde 500ml",
    category: "Băuturi",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 8.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-sos-garlic",
    name: "Sos Garlic",
    description: "Sos cremos de usturoi 25ml",
    category: "Cartofi și sosuri",
    imageUrl: "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 4.50, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  },
  {
    id: "bk-king-pie-mere",
    name: "King Pie cu mere",
    description: "Plăcintă caldă și crocantă cu umplutură dulce de mere 80g",
    category: "Deserturi",
    imageUrl: "https://images.unsplash.com/photo-1519869325930-281384150729?w=400&q=80",
    prices: [
      { platform: "glovo", available: true, price: 8.90, deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta" },
      { platform: "bolt", available: false, price: 0, deepLink: "" },
      { platform: "wolt", available: false, price: 0, deepLink: "" }
    ]
  }
];

data.menus["burgerking-constanta"] = burgerKingMenu;

fs.writeFileSync(menusFilePath, JSON.stringify(data, null, 4), 'utf8');
console.log('Successfully injected Burger King menu items into local database!');
