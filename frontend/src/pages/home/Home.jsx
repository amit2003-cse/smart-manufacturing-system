import React from 'react';
import { Package, Scan, Activity, TrendingUp, ArrowRight, MessageCircle, HelpCircle, Sparkles, Barcode, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { unitBoxesDBState, qcState, combinedBoxesDBState } from '../../store/atoms';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const Home = () => {
  const navigate = useNavigate();
  const [unitBoxes, setUnitBoxes] = useRecoilState(unitBoxesDBState);
  const [qcRecords, setQCRecords] = useRecoilState(qcState);
  const [combinedBoxes, setCombinedBoxes] = useRecoilState(combinedBoxesDBState);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Sync Unit Boxes
        const unitSnap = await getDocs(collection(db, "unit_boxes"));
        const units = unitSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUnitBoxes(units);

        // Sync QC Records
        const qcSnap = await getDocs(collection(db, "qc_requests"));
        const qc = qcSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setQCRecords(qc);

        // Sync Combined Boxes
        const combinedSnap = await getDocs(collection(db, "combined_boxes"));
        const combined = combinedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCombinedBoxes(combined);

        // 🚀 WAKE UP BACKEND (Cold Start Prevention)
        const API_URL = window.location.hostname === 'localhost' 
          ? "http://localhost:8000" 
          : "https://smart-manufacturing-system.onrender.com";
        
        fetch(`${API_URL}/health`).catch(() => {}); // Silent ping
      } catch (e) {
        console.error("Sync Error:", e);
      }
    };

    fetchData();
  }, [setUnitBoxes, setQCRecords, setCombinedBoxes]);

  const totalUnits = unitBoxes.length;
  const totalCartons = combinedBoxes.length;
  
  // Total Scans (All Time)
  const totalScansAllTime = unitBoxes.filter(box => box.isScanned).length;
  
  // Total QC Raised Requests
  const totalQCRaised = qcRecords.length;
  
  const stats = [
    { 
      title: 'Total Reels Generated', 
      value: totalUnits.toLocaleString(), 
      badge: 'Production',
      icon: <Package size={22} />, 
      color: 'blue' 
    },
    { 
      title: 'Total Scanned Reels', 
      value: totalScansAllTime.toLocaleString(), 
      badge: 'Floor Scan',
      icon: <Scan size={22} />, 
      color: 'green' 
    },
    { 
      title: 'Total QC Requests', 
      value: totalQCRaised.toLocaleString(), 
      badge: 'Quality Check',
      icon: <Activity size={22} />, 
      color: 'orange' 
    },
    { 
      title: 'Total Master Spools', 
      value: totalCartons.toLocaleString(), 
      badge: 'Dispatch',
      icon: <TrendingUp size={22} />, 
      color: 'purple' 
    },
  ];

  return (
    <div className="dashboard-container fade-in">
      {/* Modern Industrial Welcome Banner */}
      <div className="welcome-banner">
        <div className="banner-content">
          <div className="banner-badge">
            <span className="live-indicator"></span>
            <span>Real-Time MES • Plant Active</span>
          </div>
          <h1>Voltaic Cable Hub 👋</h1>
          <p>Real-time monitoring of cable reel production, floor scanning & dispatch operations.</p>
        </div>
        <div className="banner-quick-stats">
          <div className="quick-stat-pill">
            <CheckCircle2 size={16} className="pill-icon text-emerald" />
            <span>Systems Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className={`stat-card ${stat.color}`}>
            <div className="stat-top">
              <div className="stat-icon">{stat.icon}</div>
              <span className="stat-badge">{stat.badge}</span>
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section-title-wrap">
        <h3 className="section-title">Operations</h3>
        <span className="section-subtitle">Quick access to floor tasks</span>
      </div>

      <div className="actions-grid">
        <div className="action-card" onClick={() => navigate('/shipper/generate')}>
          <div className="action-left">
            <div className="action-icon-wrap blue-tone">
              <Barcode size={22} />
            </div>
            <div className="action-content">
              <h4>Generate Reel Label</h4>
              <p>Create new standardized barcodes for cable reels</p>
            </div>
          </div>
          <div className="action-arrow">
            <ArrowRight size={18} />
          </div>
        </div>

        <div className="action-card" onClick={() => navigate('/shipper/scan')}>
          <div className="action-left">
            <div className="action-icon-wrap emerald-tone">
              <Scan size={22} />
            </div>
            <div className="action-content">
              <h4>Scan Reel</h4>
              <p>Verify and track individual cable reels on floor</p>
            </div>
          </div>
          <div className="action-arrow">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>

      {/* Help / System Assistant Section */}
      <div className="assistant-card">
        <div className="assistant-layout">
          <div className="assistant-icon-badge">
            <Sparkles size={24} />
          </div>
          <div className="assistant-body">
            <div className="assistant-header-row">
              <h3>Need Help with Floor Operations?</h3>
              <span className="ai-tag">AI Powered</span>
            </div>
            <p>
              Use our AI-powered System Assistant to ask any question about manufacturing SOPs, 
              quality control rules, packaging procedures, or system operations. 
              Answers are retrieved <strong>strictly from verified factory documents</strong>.
            </p>
            <div className="prompt-chips">
              <span 
                className="prompt-chip"
                onClick={() => navigate('/assistant')}
                title="Click to ask assistant"
              >
                "What are the packaging rules?"
              </span>
              <span 
                className="prompt-chip"
                onClick={() => navigate('/assistant')}
                title="Click to ask assistant"
              >
                "Is batch mixing allowed?"
              </span>
            </div>
            <button 
              className="assistant-btn" 
              onClick={() => navigate('/assistant')}
            >
              <MessageCircle size={17} />
              <span>Open System Assistant</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
