/**
 * HealthPulse AI - Early Health Risk Scanner (ML Engine)
 * 
 * Classifies health risks (Low/Medium/High) and provides recommendations.
 * Uses sleep hours and physical activity levels for the primary MVP metrics.
 */

function scanHealthRisks(userLogs, userProfile) {
  // 1. Gather recent inputs. Defaults if no logs are available.
  const latestLog = userLogs.length > 0 ? userLogs[userLogs.length - 1] : null;
  
  const sleepHours = latestLog ? latestLog.sleepHours : 7.5; // default healthy
  const activityMinutes = latestLog ? latestLog.activityMinutes : 45; // default active
  const dietQuality = latestLog ? latestLog.dietQuality : 'Good';
  const age = userProfile ? userProfile.age || 30 : 30;
  const weight = userProfile ? userProfile.weight || 70 : 70;
  const height = userProfile ? userProfile.height || 175 : 175; // in cm
  
  // Calculate Body Mass Index (BMI)
  const heightMeters = height / 100;
  const bmi = weight / (heightMeters * heightMeters);

  // Initialize risks
  const risks = {
    obesity: { riskLevel: 'Low', score: 0, reason: 'Maintain your current activity levels and healthy BMI.', recommendations: [] },
    cardiovascular: { riskLevel: 'Low', score: 0, reason: 'Good sleep and activity levels keep your heart healthy.', recommendations: [] },
    diabetes: { riskLevel: 'Low', score: 0, reason: 'Active lifestyle keeps insulin sensitivity normal.', recommendations: [] },
    sleepQuality: { riskLevel: 'Low', score: 0, reason: 'You are getting sufficient restorative sleep.', recommendations: [] }
  };

  // --- HEALTH RISK CLASSIFICATION ENGINE (RULE-BASED ML MODEL HEURISTICS) ---

  // 1. SLEEP HOURS EVALUATION (V1 Core Metric)
  if (sleepHours < 6) {
    // High sleep deprivation
    risks.sleepQuality.score += 70;
    risks.cardiovascular.score += 40;
    risks.sleepQuality.recommendations.push('Aim for 7-9 hours of sleep. Establish a regular bedtime routine and avoid screens 1 hour before sleep.');
    risks.cardiovascular.recommendations.push('Short sleep increases blood pressure and stress hormones. Ensure consistent rest to protect your heart.');
  } else if (sleepHours < 7) {
    // Mild sleep deprivation
    risks.sleepQuality.score += 35;
    risks.cardiovascular.score += 15;
    risks.sleepQuality.recommendations.push('Try to sleep 15-30 minutes earlier to hit the optimal 7-8 hour window.');
  }

  // 2. PHYSICAL ACTIVITY EVALUATION (V1 Core Metric)
  if (activityMinutes < 20) {
    // Sedentary
    risks.obesity.score += 55;
    risks.cardiovascular.score += 50;
    risks.diabetes.score += 50;
    risks.obesity.recommendations.push('Increase physical activity. Start with a daily 15-minute walk and build up.');
    risks.cardiovascular.recommendations.push('Regular cardio strengthens the heart. Aim for at least 150 minutes of moderate activity per week.');
    risks.diabetes.recommendations.push('Muscle contraction consumes glucose. Incorporate light resistance exercises or brisk walks.');
  } else if (activityMinutes < 35) {
    // Moderately active but below recommended
    risks.obesity.score += 25;
    risks.cardiovascular.score += 20;
    risks.diabetes.score += 20;
    risks.obesity.recommendations.push('Incorporate standard exercise sessions (e.g., jogging or cycling) 3 days a week.');
  }

  // 3. DIET QUALITY AND WEIGHT TRENDS EVALUATION
  // TODO: Add dietQuality and weight trends in v2
  // Below is the planned implementation structure for V2 expansion:
  /*
  const recentWeights = userLogs.filter(l => l.weight).map(l => l.weight);
  const isWeightTrendingUp = recentWeights.length >= 3 && 
    (recentWeights[recentWeights.length - 1] > recentWeights[0]);

  if (dietQuality === 'Poor') {
    risks.diabetes.score += 30;
    risks.cardiovascular.score += 25;
    risks.diabetes.recommendations.push('Reduce refined sugars and processed carbs. Increase fiber intake.');
  }
  if (isWeightTrendingUp && bmi >= 25) {
    risks.obesity.score += 35;
    risks.obesity.recommendations.push('Weight is trending upwards. Limit calorie intake and track daily food intake.');
  }
  */

  // Fallback heuristic support using BMI from profile for MVP completeness
  if (bmi >= 30) {
    risks.obesity.score += 40;
    risks.cardiovascular.score += 20;
    risks.diabetes.score += 25;
    risks.obesity.recommendations.push('Your BMI indicates obesity. Consult a physician or nutritionist for a calibrated calorie deficit.');
  } else if (bmi >= 25) {
    risks.obesity.score += 15;
    risks.obesity.recommendations.push('Your BMI indicates you are overweight. Monitor portions and target a slight calorie deficit.');
  }

  // Combine scores into Categories (Low: 0-35, Medium: 36-65, High: 66+)
  Object.keys(risks).forEach(key => {
    const r = risks[key];
    if (r.score >= 66) {
      r.riskLevel = 'High';
    } else if (r.score >= 36) {
      r.riskLevel = 'Medium';
    } else {
      r.riskLevel = 'Low';
    }

    // Set user-friendly reasons based on results
    if (key === 'sleepQuality') {
      if (r.riskLevel === 'High') r.reason = `Severely deficient sleep (${sleepHours}h/day). High risk of chronic exhaustion and brain fog.`;
      else if (r.riskLevel === 'Medium') r.reason = `Sub-optimal sleep (${sleepHours}h/day). Recommended target is 7-9 hours.`;
    } else if (key === 'obesity') {
      if (r.riskLevel === 'High') r.reason = `Sedentary lifestyle coupled with high BMI/weight levels. Action required to reduce weight.`;
      else if (r.riskLevel === 'Medium') r.reason = `Low physical activity (${activityMinutes}m/day). Watch out for gradual weight gain.`;
    } else if (key === 'cardiovascular') {
      if (r.riskLevel === 'High') r.reason = 'Combination of low sleep hours and sedentary habits strains heart health.';
      else if (r.riskLevel === 'Medium') r.reason = 'Moderate cardiovascular risk due to below-average exercise activity.';
    } else if (key === 'diabetes') {
      if (r.riskLevel === 'High') r.reason = 'Minimal exercise increases risk of insulin resistance. Dietary adjustments recommended.';
      else if (r.riskLevel === 'Medium') r.reason = 'Slightly elevated risk. Boost muscle activity to optimize glucose clearance.';
    }
  });

  return risks;
}

module.exports = { scanHealthRisks };
