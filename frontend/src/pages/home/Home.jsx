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
    { title: 'Total Unit Boxes', value: totalUnits.toLocaleString(), icon: <Package size={24} />, color: 'blue' },
    { title: 'Total Scanned Boxes', value: totalScansAllTime.toLocaleString(), icon: <Scan size={24} />, color: 'green' },
    { title: 'Total QC Raised', value: totalQCRaised.toLocaleString(), icon: <Activity size={24} />, color: 'orange' },
    { title: 'Total Cartons', value: totalCartons.toLocaleString(), icon: <TrendingUp size={24} />, color: 'purple' },
  ];

  return (
    <div className="dashboard-container fade-in">
      <div className="welcome-banner">
        <h1>Welcome Back, Admin! 👋</h1>
        <p>Here is what's happening in the system today.</p>
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
      <h3 className="section-title">Quick Actions</h3>
      <div className="actions-grid">
        <div className="action-card" onClick={() => navigate('/shipper/generate')}>
          <div className="action-content">
            <h4>Generate Shipper</h4>
            <p>Create new barcodes and shipping labels</p>
          </div>
          <ArrowRight size={20} />
        </div>

        <div className="action-card" onClick={() => navigate('/shipper/scan')}>
          <div className="action-content">
            <h4>Scan Barcode</h4>
            <p>Verify and track existing shippers</p>
          </div>
          <ArrowRight size={20} />
        </div>
      </div>

      {/* Help / System Assistant Section */}
      <div className="card" style={{ marginTop: '24px', border: '1px solid #dbeafe', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ background: '#1e3a8a', padding: '12px', borderRadius: '12px', color: 'white', flexShrink: 0 }}>
            <HelpCircle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#1e293b' }}>Need Help?</h3>
            <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
              Use our AI-powered System Assistant to ask any question about manufacturing SOPs, 
              quality control rules, packaging procedures, or system operations. 
              The assistant answers <strong>only from your uploaded documents</strong> — no guessing.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', color: '#0369a1' }}>
                "What are the packaging rules?"
              </span>
              <span style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', color: '#0369a1' }}>
                "Is batch mixing allowed?"
              </span>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/assistant')}
              style={{ gap: '8px' }}
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
