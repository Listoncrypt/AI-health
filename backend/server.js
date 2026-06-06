const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

const db = require('./db');
const { scanHealthRisks } = require('./mlEngine');
const { generateWorkoutPlan, generateMealPlan, chatWithCoach, analyzePosture, MEAL_LIBRARY } = require('./aiEngine');
const errorHandler = require('./errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 2. Add Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 150, // slightly higher limit to accommodate active chatbot messaging
  message: { error: 'Too many requests, please slow down.' }
});
app.use('/api/', limiter);

// --- DAILY FITNESS TRACKER LOGS (NO AUTH GATE) ---

app.post('/api/tracker/logs', (req, res, next) => {
  try {
    const { userId, steps, heartRate, calories, sleepHours, activityMinutes, dietQuality, weight, date } = req.body;
    const clientUserId = userId || 'guest';

    // Convert inputs to numbers
    const numSteps = steps !== undefined ? Number(steps) : 0;
    const numHeartRate = heartRate !== undefined ? Number(heartRate) : 0;
    const numCalories = calories !== undefined ? Number(calories) : 0;
    const numSleep = sleepHours !== undefined ? Number(sleepHours) : 0;
    const numActivity = activityMinutes !== undefined ? Number(activityMinutes) : 0;
    const numWeight = weight !== undefined ? Number(weight) : null;

    // 1. Add Input Validation
    if (numSteps < 0 || numHeartRate < 30 || numSleep < 0 || numCalories < 0 || numActivity < 0 || (numWeight !== null && numWeight <= 0)) {
      return res.status(400).json({ error: 'Invalid input values' });
    }

    const log = db.addDailyLog(clientUserId, {
      date,
      steps: numSteps,
      heartRate: numHeartRate,
      calories: numCalories,
      sleepHours: numSleep,
      activityMinutes: numActivity,
      dietQuality: dietQuality || 'Good',
      weight: numWeight
    });

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

app.get('/api/tracker/logs', (req, res, next) => {
  try {
    const clientUserId = req.query.userId || 'guest';
    const logs = db.getLogsByUserId(clientUserId);
    // Sort logs by date descending
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// --- AI PERSONAL COACH ENDPOINTS (NO AUTH GATE) ---

app.get('/api/coach/workout', async (req, res, next) => {
  try {
    const goal = req.query.goal || 'weight_loss';
    const fitnessLevel = req.query.fitnessLevel || 'beginner';
    const equipment = req.query.equipment || 'bodyweight';
    const clientUserId = req.query.userId || 'guest';

    // Generate customized workout plan
    const workoutPlan = await generateWorkoutPlan(goal, fitnessLevel, equipment);
    
    // Save locally
    db.saveWorkoutPlan(clientUserId, workoutPlan);

    res.json(workoutPlan);
  } catch (err) {
    next(err);
  }
});

app.get('/api/coach/nutrition', async (req, res, next) => {
  try {
    const diet = req.query.diet || 'standard';
    const budget = req.query.budget || 'medium';
    const clientUserId = req.query.userId || 'guest';

    // Generate meal plan
    const mealPlan = await generateMealPlan(diet, budget);
    
    // Save locally
    db.saveNutritionPlan(clientUserId, mealPlan);

    res.json(mealPlan);
  } catch (err) {
    next(err);
  }
});

// --- AI COACH CHATBOT ROUTE ---
app.post('/api/coach/chat', async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages history is required' });
    }

    const reply = await chatWithCoach(messages, req.body.userProfile);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

// --- AI POSTURE VISION ANALYSIS ENDPOINT (NO AUTH GATE) ---

app.post('/api/coach/scan-posture', async (req, res, next) => {
  try {
    const { image, exercise, angles } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Parse the data URL if present: e.g. "data:image/jpeg;base64,...."
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const parts = image.split(',');
      base64Data = parts[1];
      const mimePart = parts[0].split(';')[0];
      mimeType = mimePart.split(':')[1];
    }

    const analysis = await analyzePosture(base64Data, mimeType, exercise || 'squat', angles || null);
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

// --- HEALTH RISK SCANNER ENDPOINT (NO AUTH GATE) ---

app.get('/api/risk/scan', (req, res, next) => {
  try {
    const clientUserId = req.query.userId || 'guest';
    const logs = db.getLogsByUserId(clientUserId);

    // Build temporary mock user profile from query parameters if available
    const tempProfile = {
      age: Number(req.query.age) || 30,
      weight: Number(req.query.weight) || 70,
      height: Number(req.query.height) || 175
    };

    const risks = scanHealthRisks(logs, tempProfile);
    res.json(risks);
  } catch (err) {
    next(err);
  }
});

// --- NUTRITION FAVORITES (NO AUTH GATE) ---

app.get('/api/nutrition/recipes', (req, res, next) => {
  try {
    res.json(MEAL_LIBRARY);
  } catch (err) {
    next(err);
  }
});

app.get('/api/nutrition/favorites', (req, res, next) => {
  try {
    const clientUserId = req.query.userId || 'guest';
    const favorites = db.getFavoriteMeals(clientUserId);
    res.json(favorites);
  } catch (err) {
    next(err);
  }
});

app.post('/api/nutrition/favorites', (req, res, next) => {
  try {
    const { userId, name, calories, cost, ingredients, recipe, category } = req.body;
    const clientUserId = userId || 'guest';
    
    if (!name) {
      return res.status(400).json({ error: 'Meal name is required' });
    }

    const favorite = db.addFavoriteMeal(clientUserId, {
      name,
      calories: Number(calories) || 0,
      cost: Number(cost) || 0,
      ingredients: ingredients || [],
      recipe: recipe || '',
      category: category || 'Snack'
    });

    res.status(201).json(favorite);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/nutrition/favorites/:id', (req, res, next) => {
  try {
    const clientUserId = req.query.userId || 'guest';
    const deleted = db.removeFavoriteMeal(clientUserId, req.params.id);
    if (deleted) {
      res.json({ message: 'Favorite meal removed' });
    } else {
      res.status(404).json({ error: 'Favorite meal not found' });
    }
  } catch (err) {
    next(err);
  }
});

// 4. Global Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`HealthPulse AI Backend listening on port ${PORT}`);
});
