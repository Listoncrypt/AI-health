import React, { useState, useEffect } from 'react';
import API_BASE from '../apiConfig';

export default function NutritionAdvisor({ userId }) {
  const [diet, setDiet] = useState('standard');
  const [budget, setBudget] = useState('medium');
  const [plan, setPlan] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' or 'favorites'
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchMealPlan = async (selectedDiet, selectedBudget) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/coach/nutrition?diet=${selectedDiet}&budget=${selectedBudget}&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch (err) {
      console.error('Error fetching nutrition plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/nutrition/favorites?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMealPlan(diet, budget);
      fetchFavorites();
    }
  }, [userId]);

  const handlePreferencesChange = (e) => {
    const val = e.target.value;
    if (e.target.name === 'diet') {
      setDiet(val);
      fetchMealPlan(val, budget);
    } else {
      setBudget(val);
      fetchMealPlan(diet, val);
    }
  };

  const handleSaveFavorite = async (meal) => {
    try {
      const res = await fetch(`${API_BASE}/api/nutrition/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: meal.name,
          calories: meal.calories,
          cost: meal.cost,
          ingredients: meal.ingredients,
          recipe: meal.recipe,
          category: meal.category
        })
      });

      if (res.ok) {
        setActionMessage(`❤️ Added ${meal.name} to Favorites!`);
        fetchFavorites();
        setTimeout(() => setActionMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error saving favorite:', err);
    }
  };

  const handleDeleteFavorite = async (id, name) => {
    try {
      const res = await fetch(`${API_BASE}/api/nutrition/favorites/${id}?userId=${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setActionMessage(`🗑️ Removed ${name} from Favorites.`);
        fetchFavorites();
        setTimeout(() => setActionMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting favorite:', err);
    }
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <div className="section-header">
        <h1 className="section-title">Smart Nutrition Advisor</h1>
        <p className="section-desc">Generate customized, budget-conscious recipe suggestions aligned with your lifestyle choices.</p>
      </div>

      {/* Subtab navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('planner')}
          className={`btn btn-sm ${activeTab === 'planner' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🍳 Meal Planner
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`btn btn-sm ${activeTab === 'favorites' ? 'btn-primary' : 'btn-secondary'}`}
        >
          ❤️ Saved Favorites ({favorites.length})
        </button>
      </div>

      {actionMessage && (
        <div style={{ color: 'var(--emerald)', background: 'var(--emerald-glow)', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', fontWeight: '600' }}>
          {actionMessage}
        </div>
      )}

      {activeTab === 'planner' && (
        <>
          {/* Preferences controller card */}
          <div className="card" style={{ marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">Dietary Type</label>
              <select 
                className="form-control" 
                name="diet"
                value={diet} 
                onChange={handlePreferencesChange}
              >
                <option value="standard">Standard (All foods)</option>
                <option value="vegan">Vegan (No animal products)</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="keto">Keto (High fat, low carb)</option>
                <option value="low-carb">Low-carb</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">Budget Range</label>
              <select 
                className="form-control" 
                name="budget"
                value={budget} 
                onChange={handlePreferencesChange}
              >
                <option value="low">Budget Friendly ($)</option>
                <option value="medium">Moderate ($$)</option>
                <option value="high">Premium / Whole Foods ($$$)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--sky)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
              <p style={{ color: 'var(--text-muted)' }}>Assembling recipe meal plans...</p>
            </div>
          ) : plan ? (
            <div>
              {/* Daily Summary */}
              <div className="meal-plan-summary">
                <div className="summary-stat">
                  <div className="summary-label">Selected Diet</div>
                  <div className="summary-val" style={{ textTransform: 'capitalize' }}>{plan.dietType}</div>
                </div>
                <div className="summary-stat" style={{ borderLeft: '1px solid var(--border-glass)', borderRight: '1px solid var(--border-glass)', padding: '0 30px' }}>
                  <div className="summary-label">Estimated Calories</div>
                  <div className="summary-val">{plan.totalCalories} kCal</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-label">Estimated Daily Cost</div>
                  <div className="summary-val" style={{ color: 'var(--emerald)' }}>${plan.totalCost.toFixed(2)}</div>
                </div>
              </div>

              {/* Meal Cards */}
              <div className="meal-cards">
                {plan.meals.map((meal, idx) => (
                  <div key={idx} className="card meal-card">
                    <div className="meal-badge-time">
                      <span className="meal-cat">{meal.category}</span>
                      <span className="meal-cal">{meal.calories}</span>
                      <span className="meal-cst">Est. Cost: ${meal.cost.toFixed(2)}</span>
                    </div>

                    <div className="meal-details-panel">
                      <div>
                        <h4>{meal.name}</h4>
                        <p className="recipe-text"><strong>Steps:</strong> {meal.recipe}</p>
                        
                        <div className="ingredient-tags">
                          {meal.ingredients.map((ing, i) => (
                            <span key={i} className="ing-tag">{ing}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '6px' }}
                          onClick={() => handleSaveFavorite(meal)}
                        >
                          ❤️ Favorite Recipe
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'var(--text-muted)' }}>Adjust configuration settings above to load a meal plan.</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'favorites' && (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
          {favorites.length > 0 ? (
            <div className="meal-cards">
              {favorites.map((meal) => (
                <div key={meal.id} className="card meal-card">
                  <div className="meal-badge-time" style={{ background: 'rgba(244,63,94,0.02)' }}>
                    <span className="meal-cat" style={{ color: 'var(--coral)' }}>{meal.category}</span>
                    <span className="meal-cal">{meal.calories}</span>
                    <span className="meal-cst">Est. Cost: ${meal.cost.toFixed(2)}</span>
                  </div>

                  <div className="meal-details-panel">
                    <div>
                      <h4>{meal.name}</h4>
                      <p className="recipe-text"><strong>Steps:</strong> {meal.recipe}</p>
                      
                      <div className="ingredient-tags">
                        {meal.ingredients.map((ing, i) => (
                          <span key={i} className="ing-tag" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--coral)', border: '1px solid rgba(244,63,94,0.2)' }}>{ing}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--coral)', borderColor: 'rgba(244,63,94,0.2)' }}
                        onClick={() => handleDeleteFavorite(meal.id, meal.name)}
                      >
                        🗑️ Remove Favorite
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px 0' }}>
              <span style={{ fontSize: '3rem' }}>🍽️</span>
              <p style={{ color: 'var(--text-muted)', marginTop: '15px' }}>
                Your saved recipe box is empty. Add meals from the Meal Planner!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
