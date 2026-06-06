import React, { useState, useEffect } from 'react';
import API_BASE from '../apiConfig';

export default function RiskScanner({ userId, userProfile, logs }) {
  const [risks, setRisks] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRiskScan = async () => {
    setLoading(true);
    try {
      const age = userProfile.age || 30;
      const weight = userProfile.weight || 70;
      const height = userProfile.height || 175;
      const res = await fetch(`${API_BASE}/api/risk/scan?userId=${userId}&age=${age}&weight=${weight}&height=${height}`);
      if (res.ok) {
        const data = await res.json();
        setRisks(data);
      }
    } catch (err) {
      console.error('Error scanning risks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRiskScan();
    }
  }, [userId, userProfile, logs]); // Refetch if new logs are added or profile changes to update risk calculations dynamically

  const getRiskBadgeClass = (level) => {
    if (level === 'High') return 'badge badge-high';
    if (level === 'Medium') return 'badge badge-medium';
    return 'badge badge-low';
  };

  const getRiskProgressBarColor = (level) => {
    if (level === 'High') return 'var(--coral)';
    if (level === 'Medium') return 'var(--amber)';
    return 'var(--emerald)';
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 className="section-title">Early Health Risk Scanner</h1>
          <p className="section-desc">Heuristic ML evaluation of sleep cycles, physical activities, and physical metrics.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchRiskScan} disabled={loading}>
          {loading ? 'Analyzing...' : '🔄 Scan Current Data'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--coral)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Running clinical heuristic calculations...</p>
        </div>
      ) : risks ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Main General Statement */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
            <h3>Calculated Health Risk Report</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Our early-screening engine calculates risk profiles by analyzing statistical deviations from medical reference ranges. Keep logs updated for accurate alerts.
            </p>
          </div>

          {/* Risks Cards Grid */}
          <div className="grid-cols-2">
            {Object.keys(risks).map((riskKey) => {
              const r = risks[riskKey];
              const score = r.score;
              const level = r.riskLevel;

              return (
                <div key={riskKey} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="card-header" style={{ marginBottom: '15px' }}>
                      <h4 style={{ textTransform: 'capitalize', fontSize: '1.2rem' }}>{riskKey.replace('Quality', ' Quality')} Risk</h4>
                      <span className={getRiskBadgeClass(level)}>{level}</span>
                    </div>

                    {/* Progress score bar */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Risk Threat Score</span>
                        <strong>{score}/100</strong>
                      </div>
                      <div className="metric-progress" style={{ height: '8px' }}>
                        <div 
                          className="metric-progress-bar" 
                          style={{ 
                            width: `${Math.max(score, 5)}%`, 
                            background: getRiskProgressBarColor(level) 
                          }}
                        ></div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '20px', fontWeight: '500' }}>
                      {r.reason}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div>
                    {r.recommendations.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '15px' }}>
                        <h5 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                          💡 Actionable Advice
                        </h5>
                        <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {r.recommendations.map((rec, i) => (
                            <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '14px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '0', color: getRiskProgressBarColor(level) }}>•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--text-muted)' }}>No health risk logs scanned. Log metrics to calibrate scanner.</p>
        </div>
      )}
    </div>
  );
}
