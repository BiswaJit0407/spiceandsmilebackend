const categories = [
  { slug: "breakfast", name: { en: "Breakfast", od: "ଜଳଖିଆ", hi: "नाश्ता" }, emoji: "🥞" },
  { slug: "lunch", name: { en: "Lunch", od: "ଦ୍ୱିପ୍ରହର ଭୋଜନ", hi: "दोपहर का भोजन" }, emoji: "🍛" },
  { slug: "dinner", name: { en: "Dinner", od: "ରାତ୍ରି ଭୋଜନ", hi: "रात का खाना" }, emoji: "🍽️" },
  { slug: "snacks", name: { en: "Snacks", od: "ସ୍ନାକ୍ସ", hi: "नाश्ता" }, emoji: "🍟" },
  { slug: "desserts", name: { en: "Desserts", od: "ମିଠା", hi: "मिठाई" }, emoji: "🍰" },
  { slug: "beverages", name: { en: "Beverages", od: "ପାନୀୟ", hi: "पेय" }, emoji: "🍹" }
];

const foodImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
  "https://images.unsplash.com/photo-1473093295043-cdd812d0e601",
  "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543",
  "https://images.unsplash.com/photo-1484723091791-c0d7f2831da0",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
  "https://images.unsplash.com/photo-1432139555190-58524dae6a55"
];

const generateRecipes = (authorId, dbCategories) => {
  const recipes = [];
  const baseRecipes = [
    {
      titleEn: "Spicy Curry",
      titleOd: "ମସଲାଦାର ତରକାରୀ",
      titleHi: "मसालेदार करी",
      descEn: "A rich and spicy traditional curry.",
      ingredients: [
        { item: "Onion", quantity: "2", unit: "pcs" },
        { item: "Spices", quantity: "2", unit: "tbsp" }
      ],
      steps: [
        { step: 1, instruction: "Chop the onions.", durationMin: 5 },
        { step: 2, instruction: "Cook with spices until golden.", durationMin: 15 }
      ]
    },
    {
      titleEn: "Sweet Pancakes",
      titleOd: "ମିଠା ପାନକେକ୍",
      titleHi: "मीठे पैनकेक",
      descEn: "Fluffy pancakes served with syrup.",
      ingredients: [
        { item: "Flour", quantity: "1", unit: "cup" },
        { item: "Milk", quantity: "1", unit: "cup" }
      ],
      steps: [
        { step: 1, instruction: "Mix ingredients.", durationMin: 5 },
        { step: 2, instruction: "Cook on pan.", durationMin: 10 }
      ]
    }
  ];

  for (let i = 1; i <= 50; i++) {
    const categoryObj = dbCategories[i % dbCategories.length];
    const baseObj = baseRecipes[i % baseRecipes.length];
    const image = foodImages[i % foodImages.length];

    recipes.push({
      title: {
        en: `${baseObj.titleEn} ${i}`,
        od: `${baseObj.titleOd} ${i}`,
        hi: `${baseObj.titleHi} ${i}`
      },
      description: {
        en: baseObj.descEn,
        od: "ବହୁତ ସ୍ୱାଦିଷ୍ଟ", // Simple placeholder
        hi: "बहुत स्वादिष्ट"
      },
      category: categoryObj.slug,
      imageUrl: image,
      authorId: authorId,
      ingredients: {
        en: baseObj.ingredients,
        od: baseObj.ingredients.map(ing => ({ ...ing, item: ing.item + " (Od)" })),
        hi: baseObj.ingredients.map(ing => ({ ...ing, item: ing.item + " (Hi)" }))
      },
      method: {
        en: baseObj.steps,
        od: baseObj.steps.map(s => ({ ...s, instruction: s.instruction + " (Od)" })),
        hi: baseObj.steps.map(s => ({ ...s, instruction: s.instruction + " (Hi)" }))
      },
      prepTime: 10 + (i % 5) * 5,
      cookTime: 20 + (i % 5) * 5,
      servings: 2 + (i % 4),
      difficulty: ["easy", "medium", "hard"][i % 3],
      spiceLevel: i % 6,
      status: "published"
    });
  }

  return recipes;
};

module.exports = { categories, generateRecipes };
