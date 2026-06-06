import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../apiConfig';

// Math helper to calculate the angle between three landmarks (A, B, C) where B is the vertex
function calculateAngle(a, b, c) {
  if (!a || !b || !c) return 180;
  // Calculate vectors
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return Math.round(angle);
}

// Landmark indices for drawing lines
const POSE_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // shoulders to hips
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28]  // right leg
];

export default function FormScannerModal({ isOpen, onClose, onFormAnalyzed }) {
  const [exercise, setExercise] = useState('squat');
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Real-time calculated angles from MediaPipe
  const [liveKneeAngle, setLiveKneeAngle] = useState(180);
  const [liveSpineAngle, setLiveSpineAngle] = useState(180);
  const [liveNeckAngle, setLiveNeckAngle] = useState(180);
  const [liveShoulderAngle, setLiveShoulderAngle] = useState(180);
  const [usingMediaPipe, setUsingMediaPipe] = useState(false);

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const imageCacheRef = useRef(null); // stores HTMLImageElement for canvas drawing
  const landmarksCacheRef = useRef(null); // stores latest pose landmarks array
  const mediaPipeActiveRef = useRef(true);

  // Auto-start camera when modal mounts (component only renders when isOpen=true)
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Initialize Google MediaPipe Pose
  const initMediaPipe = () => {
    if (!window.Pose) {
      console.warn("MediaPipe Pose script is not loaded in window.");
      setUsingMediaPipe(false);
      return;
    }

    try {
      const pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults((results) => {
        if (!canvasRef.current || !isOpen) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Draw camera frame or photo onto canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (results.image) {
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        }

        // Draw tracked skeleton lines & compute angles
        if (results.poseLandmarks) {
          landmarksCacheRef.current = results.poseLandmarks;
          setUsingMediaPipe(true);

          // MediaPipe landmark indices:
          // 7: Left Ear, 11: Left Shoulder, 12: Right Shoulder
          // 23: Left Hip, 24: Right Hip, 25: Left Knee, 27: Left Ankle
          const ear = results.poseLandmarks[7];
          const shoulder = results.poseLandmarks[11];
          const shoulderR = results.poseLandmarks[12];
          const hip = results.poseLandmarks[23];
          const hipR = results.poseLandmarks[24];
          const knee = results.poseLandmarks[25];
          const ankle = results.poseLandmarks[27];

          // Compute all 4 biomechanical angles from real coordinates
          const kAngle = calculateAngle(hip, knee, ankle);       // Knee flexion
          const sAngle = calculateAngle(shoulder, hip, knee);    // Spine/hip angle
          const nAngle = calculateAngle(ear, shoulder, hip);     // Neck angle
          const shAngle = calculateAngle(hipR, shoulderR, shoulder); // Shoulder alignment
          setLiveKneeAngle(kAngle);
          setLiveSpineAngle(sAngle);
          setLiveNeckAngle(nAngle);
          setLiveShoulderAngle(shAngle);

          // Draw skeleton bones
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'var(--color-accent)';
          POSE_CONNECTIONS.forEach(([i1, i2]) => {
            const p1 = results.poseLandmarks[i1];
            const p2 = results.poseLandmarks[i2];
            if (p1 && p2 && p1.visibility > 0.4 && p2.visibility > 0.4) {
              ctx.beginPath();
              ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
              ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
              ctx.stroke();
            }
          });

          // Draw main joint nodes
          const mainJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
          results.poseLandmarks.forEach((lm, idx) => {
            if (mainJoints.includes(idx) && lm.visibility > 0.4) {
              ctx.beginPath();
              ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
              ctx.fillStyle = 'var(--color-success)';
              ctx.fill();
              ctx.lineWidth = 1;
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();
            }
          });

          // Display real-time angles on canvas overlay
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.fillText(`Knee: ${kAngle}°  Spine: ${sAngle}°`, 20, 30);
          ctx.fillText(`Neck: ${nAngle}°  Shoulder: ${shAngle}°`, 20, 48);
          
          if (sAngle < 155 && exercise !== 'pushup') {
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`⚠ Spinal Rounding Detected`, 20, 66);
          } else {
            ctx.fillStyle = '#22c55e';
            ctx.fillText('✓ Spine Neutral', 20, 66);
          }
        } else {
          // Drawing fallbacks if no joints are detected in stream
          ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.font = '11px Inter, sans-serif';
          ctx.fillText("⚠️ Position your full body in frame", 20, 30);
        }

        // Scanner visual sweep bar
        const scanY = (frame * 3) % canvas.height;
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(canvas.width, scanY); ctx.stroke();
      });

      poseInstanceRef.current = pose;
    } catch (err) {
      console.error("Failed to initialize local MediaPipe Pose model:", err);
      setUsingMediaPipe(false);
    }
  };

  // Start phone/PC camera stream
  const startCamera = async () => {
    setErrorMessage('');
    setCapturedPhoto(null);
    imageCacheRef.current = null;
    landmarksCacheRef.current = null;
    mediaPipeActiveRef.current = true;

    // Load local ML model
    initMediaPipe();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Running in HTTP mode. Tap 'Take Photo' to open your native device camera.");
      setCameraActive(false);
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.play();
        setCameraActive(true);

        // Frame processor loop feeding stream frames to MediaPipe local model
        const processStreamFrame = async () => {
          if (!mediaPipeActiveRef.current) return;
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && poseInstanceRef.current) {
            try {
              await poseInstanceRef.current.send({ image: videoRef.current });
            } catch (err) {
              console.warn("MediaPipe stream parsing error:", err);
            }
          }
          // Scan ~25 frames per second
          setTimeout(processStreamFrame, 40);
        };
        processStreamFrame();
      }
    } catch (err) {
      console.warn("Camera streaming denied. Using native photo capture fallback.", err);
      setErrorMessage("Camera streaming restricted. Tap 'Take Photo' to snap a form photo.");
      setCameraActive(false);
      // Still init MediaPipe so file-captured photos can be processed for landmarks
      if (!poseInstanceRef.current) initMediaPipe();
    }
  };

  // Stop camera and loops
  const stopCamera = () => {
    mediaPipeActiveRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (poseInstanceRef.current) {
      try {
        poseInstanceRef.current.close();
      } catch(e){}
      poseInstanceRef.current = null;
    }
    setCameraActive(false);
    setCapturedPhoto(null);
    imageCacheRef.current = null;
    landmarksCacheRef.current = null;
    setUsingMediaPipe(false);
  };

  // Handle native file camera capture for iOS / non-HTTPS context
  const handleFileCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedPhoto(dataUrl);
      
      const img = new Image();
      img.onload = () => {
        imageCacheRef.current = img;

        // Draw captured photo onto canvas immediately so user sees it
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }

        // Feed the captured photo to MediaPipe to extract pose coordinates
        // Try multiple times with delay since MediaPipe model may still be loading
        const sendToMediaPipe = (attempt) => {
          if (poseInstanceRef.current && attempt < 4) {
            poseInstanceRef.current.send({ image: img }).catch(err => {
              console.warn(`MediaPipe photo parsing attempt ${attempt} error:`, err);
              if (attempt < 3) setTimeout(() => sendToMediaPipe(attempt + 1), 500);
            });
          } else if (attempt < 4) {
            // MediaPipe not ready yet, retry after delay
            setTimeout(() => sendToMediaPipe(attempt + 1), 800);
          }
        };
        sendToMediaPipe(0);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Falling back to biomechanics simulation overlays ONLY if MediaPipe is inactive
  useEffect(() => {
    if (!isOpen || usingMediaPipe) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const drawFallbackSkeleton = () => {
      if (!canvasRef.current || usingMediaPipe) return;
      frame++;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      let cycle = (frame % 120) / 120;
      let depth = Math.sin(cycle * Math.PI * 2);
      let progress = (depth + 1) / 2;

      const ankle = { x: 150, y: 240 };
      let knee = { x: 150, y: 180 };
      let hip = { x: 150, y: 120 };
      let shoulder = { x: 150, y: 60 };
      let head = { x: 150, y: 35 };

      let spineRounding = false;
      let kneeAngle = 180;

      if (exercise === 'squat') {
        knee = { x: 125 + progress * 20, y: 185 + progress * 10 };
        hip = { x: 180 - progress * 40, y: 130 + progress * 70 };
        shoulder = { x: 175 - progress * 30, y: 70 + progress * 65 };
        head = { x: 180 - progress * 25, y: 40 + progress * 60 };
        kneeAngle = Math.round(180 - progress * 95);
        if (progress > 0.75) spineRounding = true;
      } else if (exercise === 'deadlift') {
        knee = { x: 135 + progress * 15, y: 185 + progress * 5 };
        hip = { x: 195 - progress * 45, y: 130 + progress * 50 };
        shoulder = { x: 170 - progress * 20, y: 80 + progress * 50 };
        head = { x: 180 - progress * 20, y: 50 + progress * 50 };
        kneeAngle = Math.round(180 - progress * 70);
        if (progress > 0.6) spineRounding = true;
      } else {
        ankle.x = 240; ankle.y = 200;
        knee.x = 190; knee.y = 170;
        hip.x = 140; hip.y = 140;
        shoulder.x = 80; shoulder.y = 110;
        head.x = 60; head.y = 95;
        knee.y += progress * 15;
        hip.y += progress * 25;
        shoulder.y += progress * 35;
        head.y += progress * 35;
        kneeAngle = Math.round(180 - progress * 10);
      }

      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(ankle.x, ankle.y); ctx.lineTo(knee.x, knee.y); ctx.lineTo(hip.x, hip.y);
      ctx.strokeStyle = 'var(--color-accent)'; ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(hip.x, hip.y);
      if (spineRounding && exercise !== 'pushup') {
        ctx.bezierCurveTo(hip.x + 10, hip.y - 20, shoulder.x + 20, shoulder.y + 20, shoulder.x, shoulder.y);
        ctx.strokeStyle = 'var(--color-danger)';
      } else {
        ctx.lineTo(shoulder.x, shoulder.y);
        ctx.strokeStyle = 'var(--color-success)';
      }
      ctx.stroke();

      ctx.beginPath(); ctx.moveTo(shoulder.x, shoulder.y); ctx.lineTo(head.x, head.y);
      ctx.strokeStyle = 'var(--color-accent)'; ctx.stroke();

      const joints = [ankle, knee, hip, shoulder];
      joints.forEach(j => {
        ctx.beginPath();
        ctx.arc(j.x, j.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'var(--color-success)';
        ctx.fill();
        ctx.stroke();
      });

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(`Knee Flexion: ${kneeAngle}° (Simulation)`, 20, 30);
      ctx.fillStyle = spineRounding ? 'var(--color-danger)' : 'var(--color-success)';
      ctx.fillText(spineRounding ? 'WARNING: Spine Rounding' : 'Spine Alignment: Neutral', 20, 50);

      animationRef.current = requestAnimationFrame(drawFallbackSkeleton);
    };

    drawFallbackSkeleton();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, usingMediaPipe, exercise]);

  // Analyze Captured Posture based on dynamic calculations
  const handleStartAnalysis = async () => {
    setScanning(true);
    setReport(null);

    try {
      // 1. Check if we have an image source (camera or captured photo)
      const hasBody = landmarksCacheRef.current && landmarksCacheRef.current.length > 0;
      const hasImage = capturedPhoto || cameraActive;

      if (!hasImage && !hasBody) {
        setReport({
          name: exercise.toUpperCase() + ' SCAN FAILED',
          depth: 'No image available',
          spine: 'N/A',
          balance: 'N/A',
          recommendation: 'No camera feed or photo detected. Please start the camera or tap "Take Photo" to capture an image of your form first.'
        });
        setScanning(false);
        return;
      }

      // Get captured Base64 image
      let base64Image = '';
      if (capturedPhoto) {
        base64Image = capturedPhoto;
      } else {
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = 640;
        captureCanvas.height = 480;
        const captureCtx = captureCanvas.getContext('2d');
        
        if (videoRef.current && cameraActive) {
          captureCtx.drawImage(videoRef.current, 0, 0, captureCanvas.width, captureCanvas.height);
        } else if (canvasRef.current) {
          captureCtx.drawImage(canvasRef.current, 0, 0, captureCanvas.width, captureCanvas.height);
        } else {
          captureCtx.fillStyle = '#090d16';
          captureCtx.fillRect(0, 0, captureCanvas.width, captureCanvas.height);
        }
        base64Image = captureCanvas.toDataURL('image/jpeg');
      }

      // 2. Build angles payload — use real MediaPipe data if available, null otherwise
      const anglesPayload = hasBody ? {
        knee: liveKneeAngle,
        spine: liveSpineAngle,
        neck: liveNeckAngle,
        shoulder: liveShoulderAngle
      } : null;

      // 3. Dispatch image + angles to Gemini Vision API backend
      const res = await fetch(`${API_BASE}/api/coach/scan-posture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          exercise: exercise,
          angles: anglesPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReport({
          name: (data.exercise || exercise).toUpperCase() + (data.success === false ? ' — NEEDS ADJUSTMENT' : ' REAL-TIME ANALYSIS'),
          depth: data.depth || 'Captured for review',
          spine: data.spine || 'Captured for review',
          balance: data.balance || 'Captured for review',
          recommendation: data.recommendation || 'Position your full body in the frame for detailed analysis.'
        });
      } else {
        throw new Error("Gemini API request failed");
      }
    } catch (err) {
      console.warn("Gemini API unavailable, using local MediaPipe angle calculations:", err.message);
      
      // LOCAL FALLBACK: Uses REAL MediaPipe angle data — zero mock values
      const hasBodyFallback = landmarksCacheRef.current && landmarksCacheRef.current.length > 0;
      if (!hasBodyFallback) {
        setReport({
          name: exercise.toUpperCase() + ' — AI SERVICE BUSY',
          depth: 'Photo captured successfully',
          spine: 'Awaiting AI analysis',
          balance: 'Awaiting AI analysis',
          recommendation: 'The Gemini AI service is temporarily rate-limited. Your photo was captured. Please wait 30 seconds and try again, or position yourself so your full body is visible for local MediaPipe tracking.'
        });
        setScanning(false);
        return;
      }

      let depthText = '';
      let spineText = '';
      let cueText = '';

      if (exercise === 'squat') {
        if (liveKneeAngle > 160) {
          depthText = `Standing upright (Knee: ${liveKneeAngle}°)`;
          cueText = "You are standing. Push hips back and bend knees to squat.";
        } else if (liveKneeAngle > 110) {
          depthText = `Partial squat (Knee: ${liveKneeAngle}°)`;
          cueText = "Sink deeper until thighs are parallel to the floor.";
        } else {
          depthText = `Full depth achieved (Knee: ${liveKneeAngle}°)`;
          cueText = "Good depth. Drive through heels to stand.";
        }
        spineText = liveSpineAngle < 155
          ? `Spinal rounding detected (${liveSpineAngle}°) — brace core, keep chest up`
          : `Neutral spine (${liveSpineAngle}°)`;
      } else if (exercise === 'deadlift') {
        depthText = liveSpineAngle > 165
          ? `Good hip hinge (Spine: ${liveSpineAngle}°)`
          : `Excessive forward lean (Spine: ${liveSpineAngle}°)`;
        spineText = liveSpineAngle < 150
          ? `Dangerous spinal rounding (${liveSpineAngle}°)`
          : `Acceptable spine (${liveSpineAngle}°)`;
        cueText = liveSpineAngle < 155
          ? "Spinal flexion detected. Engage lats and maintain neutral spine."
          : "Spine OK. Keep bar close to body.";
      } else {
        depthText = `Plank: ${liveKneeAngle > 150 ? 'Proper extension' : 'Knees bending'} (${liveKneeAngle}°)`;
        spineText = liveSpineAngle > 160
          ? `Core engaged (${liveSpineAngle}°)`
          : `Hip sag detected (${liveSpineAngle}°) — tighten core`;
        cueText = "Maintain straight line from shoulders to ankles.";
      }

      if (liveNeckAngle < 140) {
        cueText += ` Neck angle ${liveNeckAngle}° — avoid forward head tilt.`;
      }

      setReport({
        name: exercise.toUpperCase() + ' MEDIAPIPE ANALYSIS',
        depth: depthText,
        spine: spineText,
        balance: `Shoulder alignment: ${liveShoulderAngle}°`,
        recommendation: cueText + ' (Live MediaPipe measurements)'
      });
    } finally {
      setScanning(false);
    }
  };

  const handleSyncToCoach = () => {
    if (!report) return;
    
    const summary = `[AI Pose-Form Report - ${report.name}]
    • Metrics: Depth/Alignment: ${report.depth}
    • Spine Guard Check: ${report.spine}
    • Center of Mass Balance: ${report.balance}
    • Bio-Corrective Cue: ${report.recommendation}`;

    onFormAnalyzed(summary);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="pose-modal-overlay">
      <div className="pose-modal-card">
        {/* Hidden video element for media stream */}
        <video 
          ref={videoRef} 
          style={{ display: 'none' }} 
          playsInline 
          muted 
        />

        {/* Hidden file input for native camera fallback */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          capture="user" 
          style={{ display: 'none' }} 
          onChange={handleFileCapture}
        />

        <div className="pose-modal-header">
          <h3>🤖 AI Pose-Form Vision Scanner</h3>
          <button className="pose-close-x" onClick={onClose}>×</button>
        </div>

        {errorMessage && (
          <div className="pose-error-banner">
            ℹ️ {errorMessage}
          </div>
        )}

        <div className="pose-grid">
          
          {/* Left Canvas Panel */}
          <div className="pose-left-panel">
            <canvas 
              ref={canvasRef} 
              width="300" 
              height="280" 
              className="pose-canvas"
            />
            
            <div style={{ marginTop: '15px' }}>
              <label className="form-label">Exercise Target</label>
              <select 
                className="form-control" 
                value={exercise} 
                onChange={(e) => { setExercise(e.target.value); setReport(null); }}
                disabled={scanning}
              >
                <option value="squat">Back Squat</option>
                <option value="deadlift">Conventional Deadlift</option>
                <option value="pushup">Standard Push-up</option>
              </select>
            </div>
          </div>

          {/* Right Status Panel */}
          <div className="pose-right-panel">
            <div className="pose-report-content">

              {scanning && (
                <div className="pose-loading-box">
                  <div className="pose-spinner" />
                  <span>Analyzing your form with AI...</span>
                </div>
              )}

              {!scanning && !report && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Step 1: Capture */}
                  <div style={{ 
                    padding: '16px', 
                    border: capturedPhoto ? '1px solid var(--color-success)' : '1px dashed var(--color-border-active)', 
                    borderRadius: '10px', 
                    background: capturedPhoto ? 'rgba(34, 197, 94, 0.05)' : 'rgba(59, 130, 246, 0.03)',
                    textAlign: 'center'
                  }}>
                    {capturedPhoto ? (
                      <>
                        <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>✅</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-success)', fontWeight: 600, marginBottom: '8px' }}>
                          Photo Captured Successfully
                        </div>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => fileInputRef.current.click()}>
                          📷 Retake Photo
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>📷</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
                          Step 1: Capture your form
                        </div>
                        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => fileInputRef.current.click()}>
                          📸 Open Camera & Take Photo
                        </button>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          Position your full body in the frame
                        </div>
                      </>
                    )}
                  </div>

                  {/* Step 2: Analyze */}
                  <button 
                    className="btn btn-primary" 
                    style={{ 
                      width: '100%', 
                      padding: '14px', 
                      fontSize: '0.9rem', 
                      fontWeight: 700,
                      opacity: (capturedPhoto || cameraActive) ? 1 : 0.5
                    }} 
                    onClick={handleStartAnalysis}
                    disabled={scanning}
                  >
                    {capturedPhoto || cameraActive ? '🔬 Analyze Pose with AI' : '↑ Take a Photo First'}
                  </button>

                </div>
              )}

              {report && (
                <div className="pose-report-card">
                  <h4>{report.name}</h4>
                  <ul>
                    <li><strong>Alignment/Depth:</strong> {report.depth}</li>
                    <li style={{ color: (report.spine || '').toLowerCase().includes('warning') || (report.spine || '').toLowerCase().includes('rounding') ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      <strong>Spine Guard:</strong> {report.spine}
                    </li>
                    <li><strong>Balance:</strong> {report.balance}</li>
                  </ul>
                  <div className="pose-correction-block">
                    <strong>Coaching Advice:</strong> {report.recommendation}
                  </div>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ marginTop: '12px', width: '100%' }} 
                    onClick={() => { setReport(null); setCapturedPhoto(null); }}
                  >
                    🔄 Scan Again
                  </button>
                </div>
              )}
            </div>

            <div className="pose-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                Close
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                disabled={!report || scanning}
                onClick={handleSyncToCoach}
              >
                Send to Coach
              </button>
            </div>

          </div>

        </div>
      </div>
      
      <style>{`
        /* Modal Overlay */
        .pose-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(4, 6, 10, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 12px;
          animation: fadeIn 0.2s ease;
        }

        /* Responsive Card */
        .pose-modal-card {
          width: 100%;
          max-width: 660px;
          max-height: 95vh;
          background-color: var(--bg-card);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .pose-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 12px;
        }

        .pose-modal-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
        }

        .pose-close-x {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 1.5rem;
          line-height: 1;
        }

        .pose-close-x:hover {
          color: var(--text-primary);
        }

        .pose-error-banner {
          background-color: rgba(59, 130, 246, 0.08);
          border: 1px solid var(--color-border-active);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.76rem;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        /* Two-Column Responsive Grid */
        .pose-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 640px) {
          .pose-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .pose-modal-card {
            padding: 16px;
          }
          .pose-left-panel {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .pose-canvas {
            width: 100% !important;
            max-width: 300px;
          }
        }

        .pose-left-panel {
          width: 100%;
        }

        .pose-canvas {
          background: #080c14;
          border-radius: 8px;
          border: 1px solid var(--color-border);
          display: block;
          width: 300px;
          height: 280px;
        }

        /* Right Panel */
        .pose-right-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
          min-height: 320px;
        }

        .pose-report-content {
          flex-grow: 1;
        }

        .pose-loading-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 12px;
          border: 1px dashed var(--color-border-active);
          background-color: rgba(59, 130, 246, 0.02);
          border-radius: 8px;
        }

        .pose-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        .pose-capture-placeholder {
          text-align: center;
          padding: 24px 12px;
          border: 1px dashed var(--color-border);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.01);
        }

        .pose-camera-icon {
          font-size: 1.8rem;
          display: block;
          margin-bottom: 8px;
        }

        /* Posture Report Output */
        .pose-report-card {
          animation: fadeIn 0.2s ease;
          background: rgba(255, 255, 255, 0.02);
          padding: 14px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
        }

        .pose-report-card h4 {
          font-size: 0.88rem;
          color: var(--color-accent);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .pose-report-card ul {
          list-style-type: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .pose-correction-block {
          margin-top: 10px;
          border-top: 1px solid var(--color-border);
          padding-top: 8px;
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .pose-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
