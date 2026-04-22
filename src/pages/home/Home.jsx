import React from 'react';
import { Package, Scan, Activity, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { unitBoxesDBState, qcState, combinedBoxesDBState } from '../../store/atoms';

const Home = () => {
  const navigate = useNavigate();
  const unitBoxes = useRecoilValue(unitBoxesDBState);
  const qcRecords = useRecoilValue(qcState);
  const combinedBoxes = useRecoilValue(combinedBoxesDBState);

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
    </div>
  );
};

export default Home;
