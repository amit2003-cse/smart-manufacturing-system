import React from 'react';
import { Package, Scan, Activity, TrendingUp, ArrowRight, MessageCircle, HelpCircle } from 'lucide-react';
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
    { title: 'Total Reels Generated', value: totalUnits.toLocaleString(), icon: <Package size={24} />, color: 'blue' },
    { title: 'Total Scanned Reels', value: totalScansAllTime.toLocaleString(), icon: <Scan size={24} />, color: 'green' },
    { title: 'Total QC Requests', value: totalQCRaised.toLocaleString(), icon: <Activity size={24} />, color: 'orange' },
    { title: 'Total Master Spools', value: totalCartons.toLocaleString(), icon: <TrendingUp size={24} />, color: 'purple' },
  ];

  return (
    <div className="dashboard-container fade-in">
      <div className="welcome-banner">
        <h1>Voltaic Cable Hub 👋</h1>
        <p>Real-time monitoring of reel production and dispatch operations.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 className="section-title">Operations</h3>
      <div className="actions-grid">
        <div className="action-card" onClick={() => navigate('/shipper/generate')}>
          <div className="action-content">
            <h4>Generate Reel Label</h4>
            <p>Create new barcodes for cable reels</p>
          </div>
          <ArrowRight size={20} />
        </div>

        <div className="action-card" onClick={() => navigate('/shipper/scan')}>
          <div className="action-content">
            <h4>Scan Reel</h4>
            <p>Verify and track individual cable reels</p>
          </div>
          <ArrowRight size={20} />
        </div>
      </div>

      {/* Help / System Assistant Section */}
      <div className="card" style={{ 
        marginTop: '32px', 
        border: '1px solid rgba(211, 47, 47, 0.1)', 
        background: 'linear-gradient(135deg, #ffffff 0%, #fff5f5 100%)',
        boxShadow: '0 10px 25px -5px rgba(211, 47, 47, 0.05)',
        borderRadius: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #d32f2f 0%, #990000 100%)', 
            padding: '16px', 
            borderRadius: '16px', 
            color: 'white', 
            flexShrink: 0,
            boxShadow: '0 8px 16px rgba(211, 47, 47, 0.2)'
          }}>
            <HelpCircle size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: '#1e293b', fontWeight: '800' }}>Need Help?</h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
              Use our AI-powered System Assistant to ask any question about manufacturing SOPs, 
              quality control rules, packaging procedures, or system operations. 
              The assistant answers <strong>only from your uploaded documents</strong> — no guessing.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ background: 'white', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', color: '#b91c1c', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                "What are the packaging rules?"
              </span>
              <span style={{ background: 'white', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', color: '#b91c1c', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                "Is batch mixing allowed?"
              </span>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/assistant')}
              style={{ 
                gap: '8px', 
                background: '#1e3a8a', 
                border: 'none', 
                padding: '12px 24px', 
                borderRadius: '12px',
                fontWeight: '700',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)'
              }}
            >
              <MessageCircle size={18} />
              Open System Assistant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
