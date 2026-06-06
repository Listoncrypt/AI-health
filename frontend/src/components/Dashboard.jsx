import React, { useState } from 'react';

export default function Dashboard({ user, logs, risks, onLogAdded, activeShield }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Get today's log (most recent)
  const todayLog = logs && logs.length > 0 ? logs[0] : null;

  // Daily Goals
  const STEPS_GOAL = 10000;
  const CALORIES_GOAL = 2200;
  const ACTIVITY_GOAL = 45;

  const currentSteps = todayLog ? todayLog.steps : 0;
  const currentCalories = todayLog ? todayLog.calories : 0;
  const currentActivity = todayLog ? todayLog.activityMinutes : 0;
  const currentHeartRate = todayLog ? todayLog.heartRate : 0;
  const currentSleep = todayLog ? todayLog.sleepHours : 0;

  const stepsPercent = Math.round((currentSteps / STEPS_GOAL) * 100);
  const caloriesPercent = Math.round((currentCalories / CALORIES_GOAL) * 100);
  const activityPercent = Math.round((currentActivity / ACTIVITY_GOAL) * 100);

  // SVG Progress Ring calculation
  const renderProgressRing = (percent, label, value, color) => {
    const radius = 50;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const clampedPercent = Math.min(Math.max(percent, 0), 100);
    const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

    return (
      <div className="progress-ring-container">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="progress-ring-text">
          <span className="progress-ring-val">{value}</span>
          <span className="progress-ring-lbl">{label}</span>
        </div>
      </div>
    );
  };

  // Mock Wearable Integration Sync
  const handleWearableSync = () => {
    setIsSyncing(true);
    setSyncMessage('Connecting to Apple Health / Fitbit...');
    
    setTimeout(() => {
      const syncedLog = {
        date: new Date().toISOString().split('T')[0],
        steps: Math.floor(Math.random() * 4000) + 7500,
        heartRate: Math.floor(Math.random() * 20) + 65,
        calories: Math.floor(Math.random() * 300) + 400,
        sleepHours: (Math.random() * 2 + 6.5).toFixed(1),
        activityMinutes: Math.floor(Math.random() * 30) + 30,
        dietQuality: 'Excellent',
        weight: user.weight || 75
      };

      onLogAdded(syncedLog);
      setIsSyncing(false);
      setSyncMessage('✅ Data successfully synced from Apple Health!');
      setTimeout(() => setSyncMessage(''), 4000);
    }, 1800);
  };

  // Find elevated risks
  const activeRisks = [];
  if (risks) {
    Object.keys(risks).forEach(key => {
      if (risks[key].riskLevel !== 'Low') {
        activeRisks.push({ name: key, ...risks[key] });
      }
    });
  }

  // Friendly reminders based on goals
  let reminder = '💡 Fill out your logs to keep tracking your health status!';
  if (todayLog) {
    if (currentSteps < STEPS_GOAL) {
      reminder = `🚶 Keep going! You are ${STEPS_GOAL - currentSteps} steps away from your daily target.`;
    } else if (currentActivity < ACTIVITY_GOAL) {
      reminder = `⏱ Go for a quick jog! You are just ${ACTIVITY_GOAL - currentActivity} active minutes away from your target.`;
    } else {
      reminder = '🎉 Amazing work! You have hit your core steps and activity goals for today!';
    }
  }

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <div className="section-header">
        <h1 className="section-title">Welcome back, {user.name || 'Guest User'}!</h1>
        <p className="section-desc">Here is your health dashboard for today.</p>
      </div>

      {/* Bio-Risk Shield Alert Banner (Hackathon Feature) */}
      {activeShield && activeShield !== 'none' && (
        <div 
          className="alert-banner" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(244, 63, 94, 0.15) 100%)', 
            border: '1px solid var(--amber)',
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.15)',
            marginBottom: '20px'
          }}
        >
          <div className="alert-content">
            <span className="alert-icon" style={{ fontSize: '2.2rem' }}>🛡️</span>
            <div>
              <div className="alert-title" style={{ color: 'var(--amber)', fontWeight: 'bold' }}>
                AI Bio-Risk Shield Engaged: {activeShield.toUpperCase()} PROTECTION ACTIVE
              </div>
              <div className="alert-desc" style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>
                Your training schedule has been dynamically adjusted. High-stress exercises are blocked to safeguard your joint mechanics and accelerate rehabilitation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Banner */}
      <div className="alert-banner">
        <div className="alert-content">
          <span className="alert-icon">⚡</span>
          <div>
            <div className="alert-title">Daily Focus</div>
            <div className="alert-desc">{reminder}</div>
          </div>
        </div>
        <div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleWearableSync}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : '🔌 Sync Wearable'}
          </button>
        </div>
      </div>
      {syncMessage && (
        <div style={{ color: 'var(--sky)', fontSize: '0.9rem', marginBottom: '20px', fontWeight: '600' }}>
          {syncMessage}
        </div>
      )}

      {/* Core Progress Rings */}
      <div className="grid-cols-2" style={{ gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
          <h3 style={{ marginBottom: '15px' }}>Steps Progress</h3>
          {renderProgressRing(stepsPercent, 'Steps', `${currentSteps.toLocaleString()} / ${STEPS_GOAL.toLocaleString()}`, 'var(--emerald)')}
          <p style={{ marginTop: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {stepsPercent >= 100 ? 'Goal achieved! Excellent work!' : `${stepsPercent}% of daily goal`}
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
          <h3 style={{ marginBottom: '15px' }}>Calories Burned</h3>
          {renderProgressRing(caloriesPercent, 'kCal', `${currentCalories} / ${CALORIES_GOAL}`, 'var(--sky)')}
          <p style={{ marginTop: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {caloriesPercent >= 100 ? 'Goal achieved! Keep moving!' : `${caloriesPercent}% of daily goal`}
          </p>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid-cols-4">
        <div className="card metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'var(--coral-glow)', color: 'var(--coral)' }}>
            💓
          </div>
          <div className="metric-info">
            <span className="metric-value">{currentHeartRate > 0 ? `${currentHeartRate} bpm` : '--'}</span>
            <span className="metric-label">Heart Rate</span>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'var(--sky-glow)', color: 'var(--sky)' }}>
            🌙
          </div>
          <div className="metric-info">
            <span className="metric-value">{currentSleep > 0 ? `${currentSleep} hrs` : '--'}</span>
            <span className="metric-label">Sleep</span>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'var(--emerald-glow)', color: 'var(--emerald)' }}>
            ⏱
          </div>
          <div className="metric-info">
            <span className="metric-value">{currentActivity} min</span>
            <span className="metric-label">Active Time</span>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'var(--amber-glow)', color: 'var(--amber)' }}>
            ⚖
          </div>
          <div className="metric-info">
            <span className="metric-value">{todayLog && todayLog.weight ? `${todayLog.weight} kg` : `${user.weight || '--'} kg`}</span>
            <span className="metric-label">Weight</span>
          </div>
        </div>
      </div>

      {/* Main Double Panel */}
      <div className="grid-cols-2">
        {/* Risks Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Early Health Risk Status</h3>
          </div>
          {activeRisks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                The health risk engine has flagged potential alerts based on your current metrics:
              </p>
              {activeRisks.map(risk => (
                <div 
                  key={risk.name} 
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ textTransform: 'capitalize' }}>{risk.name} Risk</strong>
                    <span className={`badge badge-${risk.riskLevel.toLowerCase()}`}>
                      {risk.riskLevel}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{risk.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <span style={{ fontSize: '3rem' }}>🛡</span>
              <h4 style={{ marginTop: '10px', color: 'var(--emerald)' }}>All Systems Clear</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                Your current sleep and activity logs indicate low general risks. Keep it up!
              </p>
            </div>
          )}
        </div>

        {/* Weekly Trend (Simulated) */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Weekly Trend</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Past 5 days</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            {/* Steps Trend */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span>Daily Steps Average</span>
                <strong>7,430 steps</strong>
              </div>
              <div className="metric-progress">
                <div className="metric-progress-bar" style={{ width: '74.3%', background: 'var(--emerald)' }}></div>
              </div>
            </div>

            {/* Calories Trend */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span>Calories Burned Average</span>
                <strong>1,890 kCal</strong>
              </div>
              <div className="metric-progress">
                <div className="metric-progress-bar" style={{ width: '85.9%', background: 'var(--sky)' }}></div>
              </div>
            </div>

            {/* Sleep Trend */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span>Sleep Average</span>
                <strong>6.8 hrs</strong>
              </div>
              <div className="metric-progress">
                <div className="metric-progress-bar" style={{ width: '85%', background: 'var(--amber)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
