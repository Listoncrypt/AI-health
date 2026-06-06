import React, { useState } from 'react';

export default function FitnessTracker({ logs, onAddLog }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    steps: '',
    heartRate: '',
    calories: '',
    sleepHours: '',
    activityMinutes: '',
    dietQuality: 'Good',
    weight: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Local input conversions
    const steps = formData.steps !== '' ? Number(formData.steps) : 0;
    const heartRate = formData.heartRate !== '' ? Number(formData.heartRate) : 0;
    const calories = formData.calories !== '' ? Number(formData.calories) : 0;
    const sleepHours = formData.sleepHours !== '' ? Number(formData.sleepHours) : 0;
    const activityMinutes = formData.activityMinutes !== '' ? Number(formData.activityMinutes) : 0;
    const weight = formData.weight !== '' ? Number(formData.weight) : null;

    // 1. Add Input Validation (Matching backend specifications)
    if (steps < 0) {
      setError('Steps cannot be negative.');
      return;
    }
    if (heartRate !== 0 && heartRate < 30) {
      setError('Heart rate must be at least 30 bpm.');
      return;
    }
    if (sleepHours < 0) {
      setError('Sleep hours cannot be negative.');
      return;
    }
    if (calories < 0) {
      setError('Calories burned cannot be negative.');
      return;
    }
    if (activityMinutes < 0) {
      setError('Activity minutes cannot be negative.');
      return;
    }
    if (weight !== null && weight <= 0) {
      setError('Weight must be greater than 0.');
      return;
    }

    const newLog = {
      date: formData.date,
      steps,
      heartRate: heartRate || 70, // default if left blank
      calories,
      sleepHours,
      activityMinutes,
      dietQuality: formData.dietQuality,
      weight
    };

    const successResponse = await onAddLog(newLog);
    if (successResponse) {
      setSuccess('Daily metrics successfully saved!');
      // Reset numeric inputs
      setFormData({
        date: new Date().toISOString().split('T')[0],
        steps: '',
        heartRate: '',
        calories: '',
        sleepHours: '',
        activityMinutes: '',
        dietQuality: 'Good',
        weight: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Failed to store metrics. Please check inputs.');
    }
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <div className="section-header">
        <h1 className="section-title">Fitness & Health Tracker</h1>
        <p className="section-desc">Log your daily metrics manually to calibrate your risk status and update your coach.</p>
      </div>

      <div className="grid-cols-2" style={{ alignItems: 'start' }}>
        {/* Form Card */}
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Log Today's Metrics</h3>
          {error && <div style={{ color: 'var(--coral)', background: 'var(--coral-glow)', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>}
          {success && <div style={{ color: 'var(--emerald)', background: 'var(--emerald-glow)', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', fontWeight: '500' }}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                name="date" 
                className="form-control"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Steps Walked</label>
                <input 
                  type="number" 
                  name="steps" 
                  placeholder="e.g. 8000" 
                  className="form-control"
                  value={formData.steps}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Heart Rate (bpm)</label>
                <input 
                  type="number" 
                  name="heartRate" 
                  placeholder="e.g. 72" 
                  className="form-control"
                  value={formData.heartRate}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Calories Burned (kCal)</label>
                <input 
                  type="number" 
                  name="calories" 
                  placeholder="e.g. 350" 
                  className="form-control"
                  value={formData.calories}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Active Duration (min)</label>
                <input 
                  type="number" 
                  name="activityMinutes" 
                  placeholder="e.g. 45" 
                  className="form-control"
                  value={formData.activityMinutes}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sleep (hours)</label>
                <input 
                  type="number" 
                  name="sleepHours" 
                  placeholder="e.g. 7.5" 
                  step="0.1"
                  className="form-control"
                  value={formData.sleepHours}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Current Weight (kg)</label>
                <input 
                  type="number" 
                  name="weight" 
                  placeholder="Optional" 
                  step="0.1"
                  className="form-control"
                  value={formData.weight}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Diet Quality</label>
              <select 
                name="dietQuality" 
                className="form-control"
                value={formData.dietQuality}
                onChange={handleChange}
              >
                <option value="Poor">Poor (Processed food, high sugar)</option>
                <option value="Good">Good (Balanced meal, some greens)</option>
                <option value="Excellent">Excellent (Whole foods, high fiber, protein)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
              💾 Save Entry
            </button>
          </form>
        </div>

        {/* History Card */}
        <div className="card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '15px' }}>Logs History</h3>
          {logs && logs.length > 0 ? (
            <div className="logs-table-wrapper">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Steps</th>
                    <th>HR</th>
                    <th>kCal</th>
                    <th>Sleep</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: '500' }}>{log.date}</td>
                      <td>{log.steps.toLocaleString()}</td>
                      <td>{log.heartRate} bpm</td>
                      <td>{log.calories}</td>
                      <td>{log.sleepHours}h</td>
                      <td>{log.activityMinutes}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px 0' }}>
              No history logged yet. Enter your metrics on the left!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
