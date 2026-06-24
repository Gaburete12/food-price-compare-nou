const fs = require('fs');

const dataTsPath = 'client/src/lib/data.ts';
let content = fs.readFileSync(dataTsPath, 'utf8');

const newRestaurants = `  {
    id: "shaormeria-baneasa-constanta",
    name: "Shaormeria Băneasa",
    category: "Shaorma",
    city: "Constanța",
    address: "Strada Cișmelei, Constanța",
    rating: 4.5,
    reviewCount: 300,
    imageUrl: "https://images.unsplash.com/photo-1529144415895-6aaf8be872fb?w=800&q=80",
    platforms: [
      {
        platform: "glovo",
        available: false,
        deliveryFee: 0.00,
        serviceFee: 0.00,
        deliveryTime: 30,
        deepLink: ""
      },
      {
        platform: "bolt",
        available: true,
        deliveryFee: 0.00,
        serviceFee: 0.00,
        deliveryTime: 30,
        deepLink: "https://food.bolt.eu/ro-ro/462-constanta/p/56615-shaormeria-baneasa-cismelei/"
      },
      {
        platform: "wolt",
        available: true,
        deliveryFee: 0.00,
        serviceFee: 0.00,
        deliveryTime: 30,
        deepLink: "https://wolt.com/en/rou/constanta/restaurant/shaormeria-baneasa-constanta"
      }
    ],
    menu: []
  },
  {
    id: "new-dimico",
    name: "New Dimico",
    category: "Street Food",
    city: "Constanța",
    address: "Constanța",
    rating: 4.5,
    reviewCount: 150,
    imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80",
    platforms: [
      {
        platform: "glovo",
        available: false,
        deliveryFee: 0.00,
        serviceFee: 0.00,
        deliveryTime: 30,
        deepLink: ""
      },
      {
        platform: "bolt",
        available: true,
        deliveryFee: 0.00,
        serviceFee: 0.00,
        deliveryTime: 30,
        deepLink: "https://food.bolt.eu/ro-ro/462-constanta/p/149785-new-dimico/"
      },
      {
        platform: "wolt",
        available: true,
        deliveryFee: 0.00,
        serviceFee: 0.00,
        deliveryTime: 30,
        deepLink: "https://wolt.com/en/rou/constanta/restaurant/new-dimico"
      }
    ],
    menu: []
  },
  {
    id: "sarmola-street-food",
    name: "Sarmola Street Food",
    category: "Street Food",
    city: "Constanța",
    address: "Constanța",
    rating: 4.5,
    reviewCount: 100,
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    platforms: [
      {
        platform: "glovo",
        available: false,
        deliveryFee: 0.00,
        serviceFee: 0.00,
        deliveryTime: 30,
        deepLink: ""
      },
      {
        platform: "bolt",
        available: true,
        deliveryFee: 0.00,
        serviceFee: 0.00,
        deliveryTime: 30,
        deepLink: "https://food.bolt.eu/ro-ro/462-constanta/p/194320-sarmola-street-food/"
      },
      {
        platform: "wolt",
        available: false,
        deliveryFee: 0.00,
        serviceFee: 0.00,
        deliveryTime: 30,
        deepLink: ""
      }
    ],
    menu: []
  }
];`;

let newContent = content.replace(/\];\s*\/\/\s*─── Funcții helper/, ",\n" + newRestaurants.slice(0, -2) + "\n];\n\n// ─── Funcții helper");

if (newContent !== content) {
  fs.writeFileSync(dataTsPath, newContent);
  console.log("Updated data.ts");
} else {
  console.log("Failed to update data.ts");
}
