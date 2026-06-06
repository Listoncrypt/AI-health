import React, { useState, useEffect, useRef } from 'react';
import FormScannerModal from './FormScannerModal';
import API_BASE from '../apiConfig';

const QUICK_INQUIRIES = [
  "Form tips for squats with knee sensitivity?",
  "Recommend a post-workout recovery meal.",
  "Suggest a safe core routine that protects the lower back.",
  "How should I adjust my routine for active recovery?"
];

export default function AICoach({ user, userId }) {
  // Chatbot messages history
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: `Welcome to your HealthPulse AI Consultation. 

      I have evaluated your health profile:
      - Primary Goal: ${user.goal.replace('_', ' ').toUpperCase()}
      - Injuries/Pain: ${user.injuries || 'None reported'}
      - Conditions: ${user.healthConditions || 'None reported'}
      
      How can I advise you on exercise form, meal modifications, or recovery strategies today?`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [localShield, setLocalShield] = useState('none'); // 'none', 'knee', 'back', 'shoulder'
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const chatEndRef = useRef(null);

  // Auto-scroll chat feed
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, loadingChat]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loadingChat) return;

    if (!textToSend) setInputText('');

    // Pre-inject shield info to message list or userProfile payload
    const updatedHistory = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(updatedHistory);
    setLoadingChat(true);

    // Modify user profile context in real-time based on selected active shield
    const adaptedProfile = {
      ...user,
      injuries: localShield !== 'none' 
        ? `Active ${localShield.toUpperCase()} joint pain (Engaged Shield: ${localShield.toUpperCase()} Protection)` 
        : user.injuries
    };

    try {
      const res = await fetch(`${API_BASE}/api/coach/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedHistory,
          userProfile: adaptedProfile
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Connection timeout. Please try sending your message again.' }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Service unreachable. Please ensure the backend server is running.' }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const getShieldAlertMessage = () => {
    if (localShield === 'knee') return '🛡️ patellar shield active: squats, lunges, and knee loadings restricted.';
    if (localShield === 'back') return '🛡️ spine shield active: axial compression lifting and deadlifts restricted.';
    if (localShield === 'shoulder') return '🛡️ rotator cuff shield active: overhead presses and pushups restricted.';
    return '';
  };

  return (
    <div className="chat-workspace">
      {/* Scrollable Message Box */}
      <div className="chat-messages-box">
        {chatMessages.map((msg, i) => (
          <div 
            key={i} 
            className={`message-row ${msg.role === 'user' ? 'user' : 'assistant'}`}
          >
            <div className="message-bubble">
              {msg.content}
            </div>
            <span className="message-sender">
              {msg.role === 'user' ? 'You' : 'HealthPulse AI Coach'}
            </span>
          </div>
        ))}
        
        {loadingChat && (
          <div className="message-row assistant">
            <div className="message-bubble" style={{ padding: '12px 18px' }}>
              <div className="typing-dots">
                <span className="typing-dot" style={{ animationDelay: '0s' }}></span>
                <span className="typing-dot" style={{ animationDelay: '0.2s' }}></span>
                <span className="typing-dot" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
            <span className="message-sender">Typing...</span>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts Panel */}
      <div className="quick-prompt-panel">
        <div className="quick-prompts-list">
          {QUICK_INQUIRIES.map((q, idx) => (
            <button 
              key={idx}
              className="prompt-chip"
              onClick={() => handleSendMessage(q)}
              disabled={loadingChat}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="chat-input-bar">
        
        {/* Dynamic Joint Protection Shield (Hackathon Feature) */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            🛡️ Bio-Risk Shield:
          </span>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ 
              padding: '4px 10px', 
              fontSize: '0.72rem',
              backgroundColor: localShield === 'none' ? 'var(--bg-bubble-user)' : 'transparent',
              borderColor: localShield === 'none' ? 'var(--color-accent)' : 'var(--color-border)'
            }}
            onClick={() => setLocalShield('none')}
          >
            Standard
          </button>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ 
              padding: '4px 10px', 
              fontSize: '0.72rem',
              backgroundColor: localShield === 'knee' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              borderColor: localShield === 'knee' ? 'var(--color-danger)' : 'var(--color-border)',
              color: localShield === 'knee' ? 'var(--color-danger)' : 'var(--text-primary)'
            }}
            onClick={() => setLocalShield('knee')}
          >
            Knee Shield
          </button>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ 
              padding: '4px 10px', 
              fontSize: '0.72rem',
              backgroundColor: localShield === 'back' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              borderColor: localShield === 'back' ? 'var(--color-danger)' : 'var(--color-border)',
              color: localShield === 'back' ? 'var(--color-danger)' : 'var(--text-primary)'
            }}
            onClick={() => setLocalShield('back')}
          >
            Spine Shield
          </button>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ 
              padding: '4px 10px', 
              fontSize: '0.72rem',
              backgroundColor: localShield === 'shoulder' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              borderColor: localShield === 'shoulder' ? 'var(--color-danger)' : 'var(--color-border)',
              color: localShield === 'shoulder' ? 'var(--color-danger)' : 'var(--text-primary)'
            }}
            onClick={() => setLocalShield('shoulder')}
          >
            Shoulder Shield
          </button>
        </div>

        {/* Shield active alert */}
        {localShield !== 'none' && (
          <div style={{ color: 'var(--color-danger)', fontSize: '0.78rem', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {getShieldAlertMessage()}
          </div>
        )}

        {/* Input Text Form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="chat-input-form"
        >
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ minWidth: '46px', padding: '12px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setIsScannerOpen(true)}
            disabled={loadingChat}
            title="Scan Form with AI Vision"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </button>

          <input 
            type="text" 
            className="form-control" 
            placeholder="Type your wellness, form, or nutrition question here..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loadingChat}
            style={{ borderRadius: '6px' }}
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ minWidth: '100px', borderRadius: '6px' }}
            disabled={loadingChat || !inputText.trim()}
          >
            Send
          </button>
        </form>

      </div>

      {/* Camera Pose Form Analyzer Modal */}
      <FormScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onFormAnalyzed={(formSummary) => handleSendMessage(formSummary)} 
      />
    </div>
  );
}
