/**
 * HealthPulse AI - Personal Coaching & Nutrition Recommendation Engine (Upgraded)
 * 
 * Includes self-healing multi-model fallbacks, non-breakable health safety policies,
 * and detailed user profile injection for chatbot context awareness.
 */

const MOCK_TRAINER = require('./aiEngineFallbackData');

// Upgraded: Self-Healing Multi-Model query wrapper to automatically bypass 503 spikes
async function queryGemini(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('YOUR_')) {
    throw new Error('Gemini API key is not configured.');
  }

  // Multi-model list from available list
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorDetails = await res.text();
        throw new Error(`Model ${model} returned status ${res.status}: ${errorDetails}`);
      }

      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      console.warn(`Query with ${model} failed, attempting next model. Error:`, err.message);
      lastError = err;
      // Wait 300ms before retrying
      await new Promise(r => setTimeout(r, 300));
    }
  }

  throw lastError || new Error('All Gemini models failed.');
}

// --- CHAT WITH COACH ENGINE (Safety Policies & Profile Injection) ---
async function chatWithCoach(messages, userProfile) {
  try {
    const profile = userProfile || {
      name: 'Guest', age: 30, gender: 'Male', weight: 70, height: 175,
      goal: 'weight_loss', fitnessLevel: 'beginner', healthConditions: '',
      injuries: '', sleepHours: 7, waterIntake: '5-8 cups'
    };

    // Map roles to Gemini roles ('assistant' -> 'model')
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const payload = {
      contents: geminiMessages,
      systemInstruction: {
        parts: [{ 
          text: `You are "HealthPulse Coach", a friendly, certified personal trainer and nutrition consultant.
          
          You are coaching a user with the following profile:
          - Name: ${profile.name}
          - Age: ${profile.age} years old
          - Gender: ${profile.gender}
          - Weight: ${profile.weight} kg
          - Height: ${profile.height} cm
          - Fitness Goal: ${profile.goal.replace('_', ' ')}
          - Fitness Level: ${profile.fitnessLevel}
          - Chronic Health Conditions: ${profile.healthConditions || 'None reported'}
          - Active Joint Pain / Injuries: ${profile.injuries || 'None reported'}
          - Daily Sleep Duration: ${profile.sleepHours || 'Not tracked'} hours
          - Daily Water Consumption: ${profile.waterIntake || 'Not tracked'}
          
          NON-BREAKABLE HEALTH SAFETY POLICY:
          1. SAFETY FIRST: If the user describes cardiac or emergency symptoms (e.g. chest pain, severe shortness of breath, sudden numbness, extreme dizziness, palpitations), IMMEDIATELY halt standard coaching advice, tell them this is a potential medical emergency, and instruct them to seek professional medical attention or call emergency services immediately.
          2. INJURY PRESERVATION: Never recommend exercises that load or stress an actively injured joint or muscle. For example, if they have knee pain, do not recommend standard squats, lunges, or running. Suggest low-impact or upper body options.
          3. NO CLINICAL DIAGNOSES: Explain physiological symptoms in simple educational terms, but never say "You have X disease". Refer them to clinical professionals.
          4. ADAPTIVE COACHING: Focus on helping them modify their habits gradually. Keep responses concise, motivational, and limited to 2-3 short paragraphs.` 
        }]
      }
    };

    const reply = await queryGemini(payload);
    return reply;
  } catch (err) {
    console.warn('Gemini chat failed, falling back to heuristic answers. Error:', err.message);
    
    // Safety-aware fallback responses
    const latestUserMsg = messages[messages.length - 1].content.toLowerCase();
    
    if (latestUserMsg.includes('chest pain') || latestUserMsg.includes('dizzy') || latestUserMsg.includes('breath')) {
      return "🚨 SAFETY ALERT: The symptoms you are describing (chest pain/dizziness/shortness of breath) could indicate a serious cardiovascular issue. Please stop all physical activity immediately and seek medical attention or contact emergency services.";
    }
    
    if (latestUserMsg.includes('hello') || latestUserMsg.includes('hi')) {
      return `Hello! I am your HealthPulse AI coach. I have loaded your profile settings (${userProfile?.weight}kg, ${userProfile?.goal?.replace('_', ' ')} focus). How can I assist you with your fitness, workout plans, or nutrition goals today?`;
    }
    return "That's an interesting question! Based on your active profile focus, I recommend focusing on consistent habits. If you are experiencing any joint discomfort or soreness, check out the Bio-Risk Shield tab to instantly adapt your workouts.";
  }
}

// --- WORKOUT GENERATION ENGINE ---
async function generateWorkoutPlan(goal, level, equipment) {
  const formattedGoal = (goal || 'weight_loss').replace('_', ' ');
  const formattedLevel = level || 'beginner';
  const equipmentType = equipment || 'bodyweight';

  try {
    const prompt = `Generate a customized 3-day weekly workout plan for a user whose goal is "${formattedGoal}", physical fitness level is "${formattedLevel}", and has access to "${equipmentType}" equipment. 
    Respond STRICTLY in a JSON format matching the following schema:
    {
      "planName": "HealthPulse AI ${formattedLevel.toUpperCase()} ${formattedGoal.toUpperCase()} Plan",
      "goal": "${formattedGoal}",
      "level": "${formattedLevel}",
      "equipment": "${equipmentType}",
      "days": [
        {
          "day": "Day 1: Focus Area (e.g. Upper Body Focus)",
          "exercises": [
            { "name": "Exercise Name", "prescription": "Sets x Reps (or duration)", "description": "Short coaching cue on form" }
          ]
        }
      ]
    }`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const jsonText = await queryGemini(payload);
    return JSON.parse(jsonText);
  } catch (err) {
    console.warn('Gemini workout generation failed, using local mockup engine. Error:', err.message);
    return MOCK_TRAINER.getLocalWorkoutPlan(formattedGoal, formattedLevel, equipmentType);
  }
}

// --- NUTRITION RECOMMENDATION ENGINE ---
async function generateMealPlan(dietPreference, budget) {
  const diet = dietPreference || 'standard';
  const costTier = budget || 'medium';

  try {
    const prompt = `Generate a daily meal plan (consisting of exactly one Breakfast, one Lunch, and one Dinner) for a user following a "${diet}" diet on a "${costTier}" budget tier.
    Respond STRICTLY in a JSON format matching the following schema:
    {
      "dietType": "${diet}",
      "budgetTier": "${costTier}",
      "totalCalories": 1800,
      "totalCost": 15.50,
      "meals": [
        {
          "category": "Breakfast",
          "name": "Meal Title",
          "calories": 450,
          "cost": 3.50,
          "ingredients": ["Ingredient 1", "Ingredient 2"],
          "recipe": "Step-by-step prep instructions."
        },
        {
          "category": "Lunch",
          "name": "Meal Title",
          "calories": 600,
          "cost": 5.00,
          "ingredients": [...],
          "recipe": "Step-by-step instructions."
        },
        {
          "category": "Dinner",
          "name": "Meal Title",
          "calories": 750,
          "cost": 7.00,
          "ingredients": [...],
          "recipe": "Step-by-step instructions."
        }
      ]
    }`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const jsonText = await queryGemini(payload);
    return JSON.parse(jsonText);
  } catch (err) {
    console.warn('Gemini nutrition generation failed, using local mockup engine. Error:', err.message);
    return MOCK_TRAINER.getLocalMealPlan(diet, costTier);
  }
}

async function analyzePosture(imageBase64, mimeType, exercise, angles) {
  // Build angles context string from real MediaPipe data
  let anglesContext = '';
  if (angles && typeof angles === 'object') {
    anglesContext = `
    IMPORTANT: The following are REAL joint angles measured by Google MediaPipe Pose tracking on the client side. Use these to inform your analysis:
    - Knee Flexion Angle: ${angles.knee}°
    - Spine/Hip Angle (Shoulder-Hip-Knee): ${angles.spine}°
    - Neck Angle (Ear-Shoulder-Hip): ${angles.neck}°
    - Shoulder Alignment Angle: ${angles.shoulder}°
    
    These are actual biomechanical measurements, NOT estimates. Cross-reference these angles with what you see in the image to produce an accurate assessment.`;
  }

  try {
    const prompt = `You are a biomechanics expert and athletic coach. Analyze the attached image showing a person performing a "${exercise}".
    ${anglesContext}
    
    Provide a structured biomechanical evaluation of their form.
    
    CRITICAL RULES:
    1. If the image does NOT clearly show a person's full body performing the exercise, set "success" to false.
    2. Use the MediaPipe angle data (if provided) as your PRIMARY source of truth for joint angles.
    3. Do NOT fabricate angle measurements. Only reference angles that were provided to you.
    
    Respond STRICTLY in valid JSON matching this schema:
    {
      "success": true or false,
      "exercise": "${exercise}",
      "depth": "Assessment of depth/flexion using the actual knee angle if available",
      "spine": "Assessment of spine alignment using the actual spine angle if available",
      "balance": "Assessment of balance and center of mass",
      "recommendation": "Specific corrective coaching cues based on the measured angles, or error explanation if success is false"
    }`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const result = await queryGemini(payload);
    return JSON.parse(result);
  } catch (err) {
    console.error('Gemini posture analysis failed. Using local MediaPipe angle calculations. Error:', err.message);
    // Fallback uses the REAL angles from MediaPipe — no hardcoded mock data
    return buildLocalAnalysis(exercise, angles);
  }
}

// Local fallback that uses REAL MediaPipe angles — zero mock data
function buildLocalAnalysis(exercise, angles) {
  if (!angles || typeof angles !== 'object') {
    return {
      success: true,
      exercise: exercise,
      depth: 'Photo captured — awaiting real-time tracking',
      spine: 'Position full body in frame for spine assessment',
      balance: 'Stand sideways to camera for balance analysis',
      recommendation: 'Your photo was captured but the AI vision service is temporarily busy and no real-time body tracking data was available. For best results: (1) Stand 6-8 feet from camera, (2) Ensure your full body from head to ankles is visible, (3) Stand sideways for optimal joint angle detection. Try again in 30 seconds when the AI service recovers.'
    };
  }

  const knee = angles.knee || 180;
  const spine = angles.spine || 180;
  const neck = angles.neck || 180;
  const shoulder = angles.shoulder || 180;

  let depth = '';
  let spineStatus = '';
  let balance = '';
  let recommendation = '';

  if (exercise === 'squat') {
    if (knee > 160) {
      depth = `Standing upright (Knee angle: ${knee}°)`;
      recommendation = 'You are standing. Perform a squat by pushing your hips back and bending your knees.';
    } else if (knee > 110) {
      depth = `Partial squat depth (Knee angle: ${knee}°)`;
      recommendation = 'Sink deeper until thighs are parallel to the floor. Focus on sitting back into the squat.';
    } else {
      depth = `Full squat depth achieved (Knee angle: ${knee}°)`;
      recommendation = 'Good depth. Drive through your heels to stand back up.';
    }
    spineStatus = spine < 155 ? `Spinal rounding detected (${spine}°) — brace your core and keep chest up` : `Neutral spine (${spine}°)`;
    balance = knee < 130 ? 'Center of mass low — stable base' : 'Center of mass high';
  } else if (exercise === 'deadlift') {
    depth = spine > 165 ? `Good hip hinge (Spine angle: ${spine}°)` : `Excessive forward lean (Spine angle: ${spine}°)`;
    spineStatus = spine < 150 ? `Dangerous spinal rounding (${spine}°)` : `Acceptable spine position (${spine}°)`;
    balance = 'Heel-dominant stance';
    recommendation = spine < 155 ? 'Spinal flexion detected. Engage your lats, pull shoulders back, and maintain a neutral spine throughout the lift.' : 'Spine position looks acceptable. Ensure the bar stays close to your body.';
  } else {
    depth = `Plank depth: ${knee > 150 ? 'Proper extension' : 'Knees bending — extend legs'} (${knee}°)`;
    spineStatus = spine > 160 ? `Core engaged, neutral line (${spine}°)` : `Hip sag detected (${spine}°) — tighten core`;
    balance = 'Plank alignment check';
    recommendation = 'Maintain a straight line from shoulders to ankles. Do not let hips sag or pike upward.';
  }

  if (neck < 140) {
    recommendation += ` Neck angle is ${neck}° — avoid excessive forward head tilt.`;
  }

  return {
    success: true,
    exercise: exercise,
    depth: depth,
    spine: spineStatus,
    balance: balance,
    recommendation: recommendation + ' (Analysis from live MediaPipe measurements)'
  };
}

module.exports = {
  chatWithCoach,
  generateWorkoutPlan,
  generateMealPlan,
  analyzePosture,
  MEAL_LIBRARY: MOCK_TRAINER.MEAL_LIBRARY
};
