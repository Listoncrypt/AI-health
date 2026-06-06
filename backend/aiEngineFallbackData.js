/**
 * HealthPulse AI - Heuristics-Based Local Mock Engine & Data Library
 * Used as a fallback if the Gemini API is offline or has invalid keys.
 */

const EXERCISE_LIBRARY = {
  cardio: [
    { name: 'Jumping Jacks', bodyweight: true, dumbbells: false, beginner: '3 sets x 30 sec', intermediate: '4 sets x 45 sec', advanced: '5 sets x 60 sec' },
    { name: 'High Knees', bodyweight: true, dumbbells: false, beginner: '3 sets x 20 sec', intermediate: '4 sets x 40 sec', advanced: '4 sets x 60 sec' },
    { name: 'Dumbbell Shadow Boxing', bodyweight: false, dumbbells: true, beginner: '3 sets x 45 sec', intermediate: '4 sets x 60 sec', advanced: '4 sets x 90 sec' },
    { name: 'Treadmill Incline Walk/Run', bodyweight: false, gym: true, beginner: '15 min walk (5% incline)', intermediate: '25 min jog', advanced: '35 min HIIT run' }
  ],
  legs: [
    { name: 'Bodyweight Squats', bodyweight: true, dumbbells: false, beginner: '3 sets x 10 reps', intermediate: '4 sets x 15 reps', advanced: '4 sets x 25 reps' },
    { name: 'Lunges', bodyweight: true, dumbbells: false, beginner: '3 sets x 8 reps/leg', intermediate: '4 sets x 12 reps/leg', advanced: '4 sets x 20 reps/leg' },
    { name: 'Dumbbell Goblet Squats', bodyweight: false, dumbbells: true, beginner: '3 sets x 10 reps (Light)', intermediate: '3 sets x 12 reps (Medium)', advanced: '4 sets x 15 reps (Heavy)' },
    { name: 'Leg Press Machine', bodyweight: false, gym: true, beginner: '3 sets x 10 reps (Light)', intermediate: '4 sets x 10 reps (Medium)', advanced: '4 sets x 12 reps (Heavy)' }
  ],
  push: [
    { name: 'Incline Push-ups', bodyweight: true, dumbbells: false, beginner: '3 sets x 8 reps', intermediate: '4 sets x 12 reps', advanced: '4 sets x 20 reps (Standard Push-ups)' },
    { name: 'Standard Push-ups', bodyweight: true, dumbbells: false, beginner: '3 sets x 5 reps', intermediate: '3 sets x 12 reps', advanced: '4 sets x 25 reps' },
    { name: 'Dumbbell Floor Press', bodyweight: false, dumbbells: true, beginner: '3 sets x 10 reps', intermediate: '4 sets x 12 reps', advanced: '4 sets x 15 reps' },
    { name: 'Barbell Bench Press', bodyweight: false, gym: true, beginner: '3 sets x 8 reps (Bar only)', intermediate: '4 sets x 8 reps (Moderate weight)', advanced: '4 sets x 6 reps (Heavy weight)' }
  ],
  pull: [
    { name: 'Doorframe/Towel Rows', bodyweight: true, dumbbells: false, beginner: '3 sets x 8 reps', intermediate: '4 sets x 12 reps', advanced: '4 sets x 15 reps' },
    { name: 'Dumbbell Rows', bodyweight: false, dumbbells: true, beginner: '3 sets x 10 reps', intermediate: '4 sets x 12 reps', advanced: '4 sets x 12 reps (Heavy)' },
    { name: 'Lat Pulldowns', bodyweight: false, gym: true, beginner: '3 sets x 10 reps (Light)', intermediate: '4 sets x 10 reps', advanced: '4 sets x 8 reps' },
    { name: 'Pullups', bodyweight: true, gym: true, beginner: '3 sets x 3 reps (assisted)', intermediate: '3 sets x 6 reps', advanced: '4 sets x 10 reps' }
  ],
  core: [
    { name: 'Plank', bodyweight: true, dumbbells: false, beginner: '3 sets x 20 sec', intermediate: '3 sets x 45 sec', advanced: '4 sets x 60 sec' },
    { name: 'Bicycle Crunches', bodyweight: true, dumbbells: false, beginner: '3 sets x 10 reps', intermediate: '4 sets x 15 reps', advanced: '4 sets x 25 reps' },
    { name: 'Weighted Russian Twists', bodyweight: false, dumbbells: true, beginner: '3 sets x 12 reps (Light)', intermediate: '3 sets x 16 reps (Medium)', advanced: '4 sets x 20 reps (Heavy)' }
  ]
};

const MEAL_LIBRARY = [
  {
    name: 'Avocado Toast with Poached Egg',
    category: 'Breakfast',
    diets: ['standard', 'vegetarian'],
    cost: { low: 2.5, medium: 3.5, high: 4.5 },
    calories: 380,
    ingredients: ['2 slices Whole Grain Bread', '1/2 Avocado', '2 Eggs', 'Salt', 'Black Pepper', 'Red Pepper Flakes'],
    recipe: 'Toast the bread. Mash avocado with salt, pepper, and spread on toast. Poach eggs in simmering water for 3 mins and place on top. Sprinkle pepper flakes.'
  },
  {
    name: 'Peanut Butter Banana Chia Pudding',
    category: 'Breakfast',
    diets: ['standard', 'vegan', 'vegetarian'],
    cost: { low: 1.5, medium: 2.0, high: 3.0 },
    calories: 420,
    ingredients: ['3 tbsp Chia Seeds', '1 cup Almond Milk', '1 tbsp Peanut Butter', '1 ripe Banana', '1 tsp Maple Syrup'],
    recipe: 'Whisk chia seeds, almond milk, peanut butter, and maple syrup. Let sit in the fridge for 4 hours. Top with sliced banana.'
  },
  {
    name: 'Keto Bacon and Spinach Omelette',
    category: 'Breakfast',
    diets: ['keto', 'low-carb'],
    cost: { low: 3.0, medium: 4.5, high: 6.0 },
    calories: 510,
    ingredients: ['3 Large Eggs', '2 strips Bacon', '1 cup Fresh Spinach', '1 oz Cheddar Cheese', '1 tbsp Butter'],
    recipe: 'Fry bacon until crispy. Whisk eggs. Melt butter in pan, add spinach until wilted. Pour in eggs, fold in cheese and crumbled bacon. Cook until set.'
  },
  {
    name: 'Tofu and Quinoa Buddha Bowl',
    category: 'Lunch',
    diets: ['vegan', 'vegetarian'],
    cost: { low: 3.0, medium: 4.5, high: 5.5 },
    calories: 450,
    ingredients: ['1/2 cup Quinoa', '4 oz Firm Tofu', '1 cup Broccoli Florets', '1/2 Cucumber', '2 tbsp Tahini Dressing'],
    recipe: 'Cook quinoa. Cube tofu and pan-sear until golden. Steam broccoli. Assemble bowl with quinoa, tofu, broccoli, sliced cucumber, and drizzle tahini.'
  },
  {
    name: 'Zesty Lemon Herb Grilled Chicken Salad',
    category: 'Lunch',
    diets: ['standard', 'low-carb'],
    cost: { low: 3.5, medium: 5.0, high: 7.0 },
    calories: 410,
    ingredients: ['6 oz Chicken Breast', '2 cups Romaine Lettuce', '1/2 cup Cherry Tomatoes', '1 tbsp Olive Oil', '1 tbsp Lemon Juice', 'Dried Oregano'],
    recipe: 'Season chicken with oregano, salt, and grill. Slice chicken. Toss romaine, tomatoes, olive oil, and lemon juice. Top with chicken.'
  },
  {
    name: 'Keto Salmon and Asparagus Foil Pack',
    category: 'Dinner',
    diets: ['keto', 'low-carb'],
    cost: { low: 5.0, medium: 8.0, high: 12.0 },
    calories: 580,
    ingredients: ['6 oz Salmon Fillet', '8 Asparagus Spears', '2 tbsp Garlic Butter', 'Lemon Slices', 'Dill'],
    recipe: 'Place asparagus and salmon on aluminum foil. Top with garlic butter, lemon slices, and dill. Fold foil tightly. Bake at 400°F (200°C) for 15 mins.'
  },
  {
    name: 'Mediterranean Chickpea & Sweet Potato Curry',
    category: 'Dinner',
    diets: ['vegan', 'vegetarian', 'standard'],
    cost: { low: 2.0, medium: 3.5, high: 5.0 },
    calories: 490,
    ingredients: ['1 can Chickpeas', '1 Large Sweet Potato', '1 cup Coconut Milk', '1 tbsp Curry Powder', '1 cup Spinach'],
    recipe: 'Cube sweet potato and boil. Sauté curry powder, add drained chickpeas, sweet potato, and coconut milk. Simmer 10 mins. Fold in spinach.'
  },
  {
    name: 'Lean Beef and Broccoli Stir-fry',
    category: 'Dinner',
    diets: ['standard', 'low-carb'],
    cost: { low: 4.0, medium: 6.0, high: 8.5 },
    calories: 460,
    ingredients: ['6 oz Flank Steak', '2 cups Broccoli', '2 tbsp Soy Sauce', '1 tsp Sesame Oil', '1 clove Garlic'],
    recipe: 'Slice beef thinly. Sauté minced garlic in sesame oil. Add beef and stir-fry for 3 mins. Add broccoli and soy sauce. Cook 3 more mins.'
  }
];

function getLocalWorkoutPlan(formattedGoal, formattedLevel, equipmentType) {
  const exercisesByDay = {
    'Day 1: Upper Body Focus': [],
    'Day 2: Cardio & Core': [],
    'Day 3: Lower Body Focus': []
  };

  const getExercisesForCategory = (category) => {
    return EXERCISE_LIBRARY[category].filter(ex => {
      if (equipmentType === 'bodyweight') return ex.bodyweight;
      if (equipmentType === 'dumbbells') return ex.bodyweight || ex.dumbbells;
      return true;
    });
  };

  const pushList = getExercisesForCategory('push');
  const pullList = getExercisesForCategory('pull');
  const coreList = getExercisesForCategory('core');

  if (pushList.length > 0) exercisesByDay['Day 1: Upper Body Focus'].push(pushList[0]);
  if (pullList.length > 0) exercisesByDay['Day 1: Upper Body Focus'].push(pullList[0]);
  if (pushList.length > 1) exercisesByDay['Day 1: Upper Body Focus'].push(pushList[1]);
  if (coreList.length > 0) exercisesByDay['Day 1: Upper Body Focus'].push(coreList[0]);

  const cardioList = getExercisesForCategory('cardio');
  if (cardioList.length > 0) exercisesByDay['Day 2: Cardio & Core'].push(cardioList[0]);
  if (cardioList.length > 1) exercisesByDay['Day 2: Cardio & Core'].push(cardioList[1]);
  if (coreList.length > 1) exercisesByDay['Day 2: Cardio & Core'].push(coreList[1]);
  if (cardioList.length > 2) exercisesByDay['Day 2: Cardio & Core'].push(cardioList[2]);

  const legsList = getExercisesForCategory('legs');
  if (legsList.length > 0) exercisesByDay['Day 3: Lower Body Focus'].push(legsList[0]);
  if (legsList.length > 1) exercisesByDay['Day 3: Lower Body Focus'].push(legsList[1]);
  if (legsList.length > 2) exercisesByDay['Day 3: Lower Body Focus'].push(legsList[2]);
  if (coreList.length > 0) exercisesByDay['Day 3: Lower Body Focus'].push(coreList[0]);

  const days = Object.keys(exercisesByDay).map(dayName => {
    const exercises = exercisesByDay[dayName].map(ex => {
      const presc = ex[formattedLevel] || ex['beginner'] || '3 sets x 10 reps';
      return {
        name: ex.name,
        prescription: presc,
        description: `Perform matching your level (${formattedLevel}) using ${equipmentType.replace('_', ' ')}.`
      };
    });
    return { day: dayName, exercises };
  });

  return {
    planName: `HealthPulse AI ${formattedLevel.toUpperCase()} ${formattedGoal.toUpperCase()} Plan (Local Fallback)`,
    goal: formattedGoal,
    level: formattedLevel,
    equipment: equipmentType,
    days
  };
}

function getLocalMealPlan(diet, costTier) {
  let filtered = MEAL_LIBRARY.filter(meal => meal.diets.includes(diet));
  if (filtered.length === 0) {
    filtered = MEAL_LIBRARY.filter(meal => meal.diets.includes('standard'));
  }

  const breakfasts = filtered.filter(m => m.category === 'Breakfast');
  const lunches = filtered.filter(m => m.category === 'Lunch');
  const dinners = filtered.filter(m => m.category === 'Dinner');

  const b = breakfasts.length > 0 ? breakfasts[Math.floor(Math.random() * breakfasts.length)] : MEAL_LIBRARY[0];
  const l = lunches.length > 0 ? lunches[Math.floor(Math.random() * lunches.length)] : MEAL_LIBRARY[3];
  const d = dinners.length > 0 ? dinners[Math.floor(Math.random() * dinners.length)] : MEAL_LIBRARY[6];

  const meals = [b, l, d].map(meal => {
    const estCost = meal.cost[costTier] || meal.cost['medium'];
    return {
      category: meal.category,
      name: meal.name,
      calories: meal.calories,
      cost: estCost,
      ingredients: meal.ingredients,
      recipe: meal.recipe
    };
  });

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalCost = meals.reduce((sum, m) => sum + m.cost, 0);

  return {
    dietType: diet,
    budgetTier: costTier,
    totalCalories,
    totalCost: Number(totalCost.toFixed(2)),
    meals
  };
}

module.exports = {
  getLocalWorkoutPlan,
  getLocalMealPlan,
  MEAL_LIBRARY
};
