const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// Helper to initialize DB with default structure if it does not exist
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      users: [],
      dailyLogs: [],
      workoutPlans: [],
      nutritionPlans: [],
      favoriteMeals: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

// Read whole DB
function readDb() {
  initDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning empty template:', err);
    return {
      users: [],
      dailyLogs: [],
      workoutPlans: [],
      nutritionPlans: [],
      favoriteMeals: []
    };
  }
}

// Write whole DB
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// Exported database API
const db = {
  // Users
  getUserById(id) {
    const data = readDb();
    return data.users.find(u => u.id === id);
  },

  getUserByEmail(email) {
    const data = readDb();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser(user) {
    const data = readDb();
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newUser = { id, ...user };
    data.users.push(newUser);
    writeDb(data);
    return newUser;
  },

  updateUser(id, updates) {
    const data = readDb();
    const index = data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      data.users[index] = { ...data.users[index], ...updates };
      writeDb(data);
      return data.users[index];
    }
    return null;
  },

  // Daily Logs
  getLogsByUserId(userId) {
    const data = readDb();
    return data.dailyLogs.filter(log => log.userId === userId);
  },

  addDailyLog(userId, logData) {
    const data = readDb();
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newLog = {
      id,
      userId,
      date: logData.date || new Date().toISOString().split('T')[0],
      steps: Number(logData.steps) || 0,
      heartRate: Number(logData.heartRate) || 0,
      calories: Number(logData.calories) || 0,
      sleepHours: Number(logData.sleepHours) || 0,
      activityMinutes: Number(logData.activityMinutes) || 0,
      dietQuality: logData.dietQuality || 'Good', // 'Poor', 'Good', 'Excellent'
      weight: Number(logData.weight) || null
    };

    // If a log already exists for this date and user, replace it, otherwise append.
    const existingIndex = data.dailyLogs.findIndex(log => log.userId === userId && log.date === newLog.date);
    if (existingIndex !== -1) {
      // Retain previous fields if not supplied in updates
      const oldLog = data.dailyLogs[existingIndex];
      data.dailyLogs[existingIndex] = {
        ...oldLog,
        ...newLog,
        // Override the values that are explicitly provided
        steps: logData.steps !== undefined ? Number(logData.steps) : oldLog.steps,
        heartRate: logData.heartRate !== undefined ? Number(logData.heartRate) : oldLog.heartRate,
        calories: logData.calories !== undefined ? Number(logData.calories) : oldLog.calories,
        sleepHours: logData.sleepHours !== undefined ? Number(logData.sleepHours) : oldLog.sleepHours,
        activityMinutes: logData.activityMinutes !== undefined ? Number(logData.activityMinutes) : oldLog.activityMinutes,
        dietQuality: logData.dietQuality !== undefined ? logData.dietQuality : oldLog.dietQuality,
        weight: logData.weight !== undefined ? Number(logData.weight) : oldLog.weight
      };
      writeDb(data);
      return data.dailyLogs[existingIndex];
    } else {
      data.dailyLogs.push(newLog);
      writeDb(data);
      return newLog;
    }
  },

  // Workout Plans
  getWorkoutPlan(userId) {
    const data = readDb();
    return data.workoutPlans.find(plan => plan.userId === userId);
  },

  saveWorkoutPlan(userId, planData) {
    const data = readDb();
    const existingIndex = data.workoutPlans.findIndex(plan => plan.userId === userId);
    const plan = { userId, ...planData, updatedAt: new Date().toISOString() };
    if (existingIndex !== -1) {
      data.workoutPlans[existingIndex] = plan;
    } else {
      data.workoutPlans.push(plan);
    }
    writeDb(data);
    return plan;
  },

  // Nutrition Plans
  getNutritionPlan(userId) {
    const data = readDb();
    return data.nutritionPlans.find(plan => plan.userId === userId);
  },

  saveNutritionPlan(userId, planData) {
    const data = readDb();
    const existingIndex = data.nutritionPlans.findIndex(plan => plan.userId === userId);
    const plan = { userId, ...planData, updatedAt: new Date().toISOString() };
    if (existingIndex !== -1) {
      data.nutritionPlans[existingIndex] = plan;
    } else {
      data.nutritionPlans.push(plan);
    }
    writeDb(data);
    return plan;
  },

  // Favorite Meals
  getFavoriteMeals(userId) {
    const data = readDb();
    return data.favoriteMeals.filter(meal => meal.userId === userId);
  },

  addFavoriteMeal(userId, mealData) {
    const data = readDb();
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newMeal = { id, userId, ...mealData };
    
    // Prevent duplicate favorites by meal name
    const alreadyFavorited = data.favoriteMeals.some(m => m.userId === userId && m.name === mealData.name);
    if (!alreadyFavorited) {
      data.favoriteMeals.push(newMeal);
      writeDb(data);
    }
    return newMeal;
  },

  removeFavoriteMeal(userId, id) {
    const data = readDb();
    const lengthBefore = data.favoriteMeals.length;
    data.favoriteMeals = data.favoriteMeals.filter(meal => !(meal.userId === userId && meal.id === id));
    if (data.favoriteMeals.length !== lengthBefore) {
      writeDb(data);
      return true;
    }
    return false;
  }
};

module.exports = db;
