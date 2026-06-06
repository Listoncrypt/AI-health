/**
 * HealthPulse AI Backend Integration Test Suite (Token-Free & Chat bot)
 * Programmatically runs the API server, verifies endpoints, validation, and shuts down.
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

function cleanDb() {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

// Override PORT to prevent collision
process.env.PORT = 5050;

console.log('--- Starting Open HealthPulse AI Backend Tests ---');
cleanDb();

// Load server
require('./server');

setTimeout(async () => {
  try {
    const baseUrl = 'http://localhost:5050';
    const userId = 'test_guest_123';

    // Test 1: Submit valid tracker logs
    console.log('Test 1: Submitting valid metrics log...');
    const logRes = await fetch(`${baseUrl}/api/tracker/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        steps: 8500,
        heartRate: 72,
        calories: 450,
        sleepHours: 5.5,
        activityMinutes: 15,
        dietQuality: 'Poor',
        weight: 82.5,
        date: new Date().toISOString().split('T')[0]
      })
    });
    const logData = await logRes.json();
    if (logRes.status !== 201 || !logData.id) {
      throw new Error(`Logging failed: ${JSON.stringify(logData)}`);
    }
    console.log('✔ Log data saved successfully.');

    // Test 2: Input Validation (Negative steps)
    console.log('Test 2: Submitting invalid metrics log (Negative steps)...');
    const invalidRes = await fetch(`${baseUrl}/api/tracker/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        steps: -100
      })
    });
    if (invalidRes.status !== 400) {
      throw new Error(`Input validation failed to catch negative steps. Status: ${invalidRes.status}`);
    }
    console.log('✔ Input validation successfully blocked negative steps.');

    // Test 3: Health Risk Scan
    console.log('Test 3: Fetching risk scanner calculations...');
    const riskRes = await fetch(`${baseUrl}/api/risk/scan?userId=${userId}&age=28&weight=82.5&height=180`);
    const riskData = await riskRes.json();
    if (riskRes.status !== 200 || !riskData.sleepQuality) {
      throw new Error(`Scanner failed: ${JSON.stringify(riskData)}`);
    }
    console.log(`✔ Health Risks parsed. Sleep Risk: ${riskData.sleepQuality.riskLevel}`);

    // Test 4: AI Coach Workout Generator
    console.log('Test 4: Fetching dynamic workout generator...');
    const workRes = await fetch(`${baseUrl}/api/coach/workout?goal=muscle_gain&fitnessLevel=intermediate&equipment=dumbbells&userId=${userId}`);
    const workData = await workRes.json();
    if (workRes.status !== 200 || !workData.days) {
      throw new Error(`Workout gen failed: ${JSON.stringify(workData)}`);
    }
    console.log(`✔ Workout Plan created: ${workData.planName}`);

    // Test 5: AI Coach Chat Bot Endpoint
    console.log('Test 5: Testing Chat Bot communication endpoint...');
    const chatRes = await fetch(`${baseUrl}/api/coach/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hi coach, should I do cardio before or after weights?' }
        ]
      })
    });
    const chatData = await chatRes.json();
    if (chatRes.status !== 200 || !chatData.reply) {
      throw new Error(`Chat API failed: ${JSON.stringify(chatData)}`);
    }
    console.log(`✔ Chat Bot reply received: "${chatData.reply.substring(0, 60)}..."`);

    console.log('\n=============================================');
    console.log('🎉 OPEN API INTEGRATION TESTS COMPLETED 🎉');
    console.log('=============================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST FAILURE:', error.message);
    process.exit(1);
  }
}, 1500);
