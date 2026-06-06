import React, { useState, useEffect } from 'react';
import AICoach from './components/AICoach';

const DEFAULT_PROFILE = {
  id: 'guest',
  name: '',
  age: '',
  gender: 'Male',
  weight: '',
  height: '',
  goal: 'weight_loss',
  fitnessLevel: 'beginner',
  healthConditions: '',
  injuries: '',
  sleepHours: 7,
  waterIntake: '5-8 cups',
  dietPreference: 'standard'
};

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hp_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [profileCompleted, setProfileCompleted] = useState(() => {
    return localStorage.getItem('hp_profile_completed') === 'true';
  });

  // Wizard state initialized to user profile to support editing
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({
    name: user.name || '',
    age: user.age || '',
    gender: user.gender || 'Male',
    weight: user.weight || '',
    height: user.height || '',
    goal: user.goal || 'weight_loss',
    fitnessLevel: user.fitnessLevel || 'beginner',
    healthConditions: user.healthConditions || '',
    injuries: user.injuries || '',
    sleepHours: user.sleepHours || '7',
    waterIntake: user.waterIntake || '5-8 cups',
    dietPreference: user.dietPreference || 'standard'
  });
  const [wizardError, setWizardError] = useState('');

  useEffect(() => {
    localStorage.setItem('hp_profile', JSON.stringify(user));
    localStorage.setItem('hp_profile_completed', profileCompleted ? 'true' : 'false');
  }, [user, profileCompleted]);

  const handleWizardChange = (e) => {
    setWizardForm({
      ...wizardForm,
      [e.target.name]: e.target.value
    });
  };

  const handleWizardSubmit = (e) => {
    e.preventDefault();
    setWizardError('');

    // Final Validation
    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1);
      return;
    }

    if (!wizardForm.name || !wizardForm.age || !wizardForm.weight || !wizardForm.height) {
      setWizardError('Please complete all bio-metrics on Step 1.');
      setWizardStep(1);
      return;
    }

    const newUser = {
      id: user.id === 'guest' ? 'guest_' + Math.random().toString(36).substr(2, 6) : user.id,
      name: wizardForm.name,
      age: Number(wizardForm.age),
      gender: wizardForm.gender,
      weight: Number(wizardForm.weight),
      height: Number(wizardForm.height),
      goal: wizardForm.goal,
      fitnessLevel: wizardForm.fitnessLevel,
      healthConditions: wizardForm.healthConditions,
      injuries: wizardForm.injuries,
      sleepHours: Number(wizardForm.sleepHours) || 7,
      waterIntake: wizardForm.waterIntake,
      dietPreference: wizardForm.dietPreference
    };

    setUser(newUser);
    setProfileCompleted(true);
  };

  const handleEditProfile = () => {
    // Open setup wizard pre-filled with active stats
    setWizardForm({
      name: user.name,
      age: user.age,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      goal: user.goal,
      fitnessLevel: user.fitnessLevel,
      healthConditions: user.healthConditions,
      injuries: user.injuries,
      sleepHours: user.sleepHours.toString(),
      waterIntake: user.waterIntake,
      dietPreference: user.dietPreference
    });
    setWizardStep(1);
    setProfileCompleted(false);
  };

  const handleResetApp = () => {
    if (window.confirm('Reset all health profile parameters and start a new consultation?')) {
      setUser(DEFAULT_PROFILE);
      setWizardForm({
        name: '',
        age: '',
        gender: 'Male',
        weight: '',
        height: '',
        goal: 'weight_loss',
        fitnessLevel: 'beginner',
        healthConditions: '',
        injuries: '',
        sleepHours: '7',
        waterIntake: '5-8 cups',
        dietPreference: 'standard'
      });
      setWizardStep(1);
      setProfileCompleted(false);
      localStorage.removeItem('hp_profile');
      localStorage.removeItem('hp_profile_completed');
    }
  };

  // Onboarding screen layout
  if (!profileCompleted) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-logo">HealthPulse AI</h1>
            <p className="auth-subtitle">Fitness & Clinical Bio-Metrics Assessment</p>
            <div className="wizard-progress">
              <span className={`wizard-dot ${wizardStep >= 1 ? 'active' : ''}`}></span>
              <span className={`wizard-dot ${wizardStep >= 2 ? 'active' : ''}`}></span>
              <span className={`wizard-dot ${wizardStep >= 3 ? 'active' : ''}`}></span>
            </div>
          </div>

          {wizardError && <div style={{ color: 'var(--color-danger)', fontSize: '0.88rem', marginBottom: '15px', fontWeight: '500' }}>{wizardError}</div>}

          <form onSubmit={handleWizardSubmit}>
            {wizardStep === 1 && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control"
                    placeholder="e.g. Alex Carter"
                    value={wizardForm.name} 
                    onChange={handleWizardChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input 
                      type="number" 
                      name="age" 
                      className="form-control"
                      placeholder="e.g. 28"
                      value={wizardForm.age} 
                      onChange={handleWizardChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select 
                      name="gender" 
                      className="form-control"
                      value={wizardForm.gender} 
                      onChange={handleWizardChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Weight (kg)</label>
                    <input 
                      type="number" 
                      name="weight" 
                      className="form-control"
                      placeholder="e.g. 72"
                      value={wizardForm.weight} 
                      onChange={handleWizardChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Height (cm)</label>
                    <input 
                      type="number" 
                      name="height" 
                      className="form-control"
                      placeholder="e.g. 176"
                      value={wizardForm.height} 
                      onChange={handleWizardChange}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '10px' }}
                  onClick={() => {
                    if (wizardForm.name && wizardForm.age && wizardForm.weight && wizardForm.height) {
                      setWizardStep(2);
                    } else {
                      setWizardError('Please complete all bio-metric parameters.');
                    }
                  }}
                >
                  Continue to Goals
                </button>
              </div>
            )}

            {wizardStep === 2 && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <div className="form-group">
                  <label className="form-label">Focus Goal</label>
                  <select 
                    name="goal" 
                    className="form-control"
                    value={wizardForm.goal} 
                    onChange={handleWizardChange}
                  >
                    <option value="weight_loss">Weight Loss & Deficit</option>
                    <option value="muscle_gain">Muscle Building & Hypertrophy</option>
                    <option value="endurance">Cardiovascular Endurance</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fitness Level</label>
                  <select 
                    name="fitnessLevel" 
                    className="form-control"
                    value={wizardForm.fitnessLevel} 
                    onChange={handleWizardChange}
                  >
                    <option value="beginner">Beginner (Little or no training)</option>
                    <option value="intermediate">Intermediate (Regular exercise routine)</option>
                    <option value="advanced">Advanced (Highly conditioned athlete)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dietary Preference</label>
                  <select 
                    name="dietPreference" 
                    className="form-control"
                    value={wizardForm.dietPreference} 
                    onChange={handleWizardChange}
                  >
                    <option value="standard">Standard (No restrictions)</option>
                    <option value="vegan">Vegan</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="keto">Keto (High fat, low carb)</option>
                    <option value="low-carb">Low-carb</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setWizardStep(1)}>
                    Back
                  </button>
                  <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setWizardStep(3)}>
                    Continue
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <div className="form-group">
                  <label className="form-label">Active Joint Pain or Injuries?</label>
                  <input 
                    type="text" 
                    name="injuries" 
                    className="form-control"
                    placeholder="e.g. chronic lower back stiffness, knee pain on squats, none"
                    value={wizardForm.injuries} 
                    onChange={handleWizardChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Chronic Health Conditions?</label>
                  <input 
                    type="text" 
                    name="healthConditions" 
                    className="form-control"
                    placeholder="e.g. Hypertension, Asthma, none"
                    value={wizardForm.healthConditions} 
                    onChange={handleWizardChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Average Sleep (Hours/Night)</label>
                    <input 
                      type="number" 
                      name="sleepHours" 
                      className="form-control"
                      placeholder="e.g. 7"
                      value={wizardForm.sleepHours} 
                      onChange={handleWizardChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Daily Water Intake</label>
                    <select 
                      name="waterIntake" 
                      className="form-control"
                      value={wizardForm.waterIntake} 
                      onChange={handleWizardChange}
                    >
                      <option value="1-3 cups">Low (1-3 cups)</option>
                      <option value="5-8 cups">Normal (5-8 cups)</option>
                      <option value="8+ cups">Optimal (8+ cups)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setWizardStep(2)}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Finish Assessment
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Main workspace layout (laser-focused diagnostic layout)
  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="navbar-brand">
          HealthPulse AI Consultation
        </div>
        <div className="navbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleEditProfile}>
            ⚙️ Edit Profile
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleResetApp}>
            🔄 Reset consultation
          </button>
        </div>
      </header>

      {/* Main split viewport */}
      <div className="workspace-container">
        {/* Profile Details (Left Sidebar) */}
        <aside className="profile-sidebar">
          
          <div className="sidebar-section">
            <h4 className="sidebar-section-title">Consultation Subject</h4>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>{user.name}</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Bio-Metrics Assessment File</p>
          </div>

          <div className="sidebar-section">
            <h4 className="sidebar-section-title">Physical Parameters</h4>
            <div className="profile-grid">
              <div className="profile-meta-item">
                <span className="meta-label">Weight</span>
                <span className="meta-val">{user.weight} kg</span>
              </div>
              <div className="profile-meta-item">
                <span className="meta-label">Height</span>
                <span className="meta-val">{user.height} cm</span>
              </div>
              <div className="profile-meta-item">
                <span className="meta-label">Age</span>
                <span className="meta-val">{user.age} yrs</span>
              </div>
              <div className="profile-meta-item">
                <span className="meta-label">Gender</span>
                <span className="meta-val">{user.gender}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h4 className="sidebar-section-title">Goal & Focus</h4>
            <div className="profile-grid" style={{ gridTemplateColumns: '1fr', gap: '8px' }}>
              <div className="profile-meta-item">
                <span className="meta-label">Primary Goal</span>
                <span className="meta-val" style={{ textTransform: 'capitalize' }}>{user.goal.replace('_', ' ')}</span>
              </div>
              <div className="profile-meta-item">
                <span className="meta-label">Conditioning Level</span>
                <span className="meta-val" style={{ textTransform: 'capitalize' }}>{user.fitnessLevel}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h4 className="sidebar-section-title">Medical Safety Profile</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="profile-meta-item">
                <span className="meta-label">Joint Pain / Injuries</span>
                <span className="meta-val" style={{ color: user.injuries ? 'var(--color-danger)' : 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  {user.injuries || 'None reported'}
                </span>
              </div>
              <div className="profile-meta-item">
                <span className="meta-label">Chronic Conditions</span>
                <span className="meta-val" style={{ fontSize: '0.82rem' }}>
                  {user.healthConditions || 'None reported'}
                </span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h4 className="sidebar-section-title">Lifestyle Factors</h4>
            <div className="profile-grid">
              <div className="profile-meta-item">
                <span className="meta-label">Diet Focus</span>
                <span className="meta-val" style={{ textTransform: 'capitalize' }}>{user.dietPreference}</span>
              </div>
              <div className="profile-meta-item">
                <span className="meta-label">Avg. Sleep</span>
                <span className="meta-val">{user.sleepHours} hrs</span>
              </div>
              <div className="profile-meta-item">
                <span className="meta-label">Water Intake</span>
                <span className="meta-val">{user.waterIntake}</span>
              </div>
            </div>
          </div>

        </aside>

        {/* Chat Feed Panel (Right Pane) */}
        <section className="chat-workspace">
          <AICoach user={user} userId={user.id} />
        </section>
      </div>
    </div>
  );
}
