import React, { useState, useMemo } from 'react';
import { Search, CheckCircle, XCircle, Save, Undo, CheckSquare, XSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '../../firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useRecoilState } from 'recoil';

import { qcState } from '../../store/atoms';
import AppSelect from '../../components/shared/AppSelect';
import AppDataGrid from '../../components/shared/AppDataGrid';
import ConfirmModal from '../../components/shared/ConfirmModal';

const QCDecision = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [filteredList, setFilteredList] = useState([]);
  const [sessionChanges, setSessionChanges] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [qcDB, setQcDB] = useRecoilState(qcState);

  // Derive dynamic options from qcDB where status is PENDING_QC
  const pendingRequests = useMemo(() => qcDB.filter(q => q.status === 'PENDING_QC'), [qcDB]);

  const availableItems = useMemo(() => {
    const items = new Set(pendingRequests.map(q => q.itemCode));
    return Array.from(items).map(code => ({ itemCode: code, itemName: code })); // Simplified, ideally fetch itemName from a master list
  }, [pendingRequests]);

  const availableBatches = useMemo(() => {
    if (!selectedItem) return [];
    const batches = new Set(pendingRequests.filter(q => q.itemCode === selectedItem).map(q => q.batchCode));
    return Array.from(batches);
  }, [selectedItem, pendingRequests]);

  const handleSearch = () => {
    if (!selectedItem || !selectedBatch) return;
    
    const pending = pendingRequests.filter(q => q.itemCode === selectedItem && q.batchCode === selectedBatch);
    
    setFilteredList(pending);
    setSessionChanges({});
    if (pending.length === 0) toast.info("No pending QC requests for this batch.");
  };

  const updateStatus = (docId, status) => {
    setSessionChanges(prev => ({
        ...prev,
        [docId]: status
    }));
  };

  const handleBulkAction = (status) => {
    const newChanges = { ...sessionChanges };
    filteredList.forEach(item => {
        newChanges[item.id] = status;
    });
    setSessionChanges(newChanges);
  };

  const handleSaveDecisions = async () => {
    setShowConfirm(false);
    if (Object.keys(sessionChanges).length === 0) return;
    setLoading(true);

    try {
        const batch = writeBatch(db);
        
        Object.keys(sessionChanges).forEach(docId => {
            const reqRef = doc(db, "qc_requests", docId);
            batch.update(reqRef, { 
                status: sessionChanges[docId], 
                decidedAt: new Date().toISOString() 
            });
        });

        await batch.commit();

        // Update Local SSoT
        const updatedQC = qcDB.map(q => {
            if (sessionChanges[q.id]) {
                return { ...q, status: sessionChanges[q.id] };
            }
            return q;
        });
        setQcDB(updatedQC);

        setFilteredList([]);
        setSessionChanges({});
        toast.success("QC decisions saved to System!");
    } catch (e) {
        toast.error("Save Error. Check connection.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">QC Decision (Approve / Reject)</h2>
        <p className="help-text">
          Review pending Quality Control requests. Use bulk actions or decide individually, then save to commit decisions to the system.
        </p>
      </div>

      <div className="filter-card card no-print">
        <div className="filter-grid">
          <AppSelect 
            label="Item (Pending QC)"
            dataSource={availableItems} 
            displayExpr="itemName" 
            valueExpr="itemCode"
            value={selectedItem} 
            onValueChanged={e => { setSelectedItem(e.value); setSelectedBatch(null); }}
            placeholder="Select..."
          />
          <AppSelect 
            label="Batch (Pending QC)"
            dataSource={availableBatches}
            value={selectedBatch} 
            onValueChanged={e => setSelectedBatch(e.value)}
            disabled={!selectedItem}
            placeholder="Select..."
          />
          <div className="filter-actions" style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSearch} disabled={!selectedBatch} style={{ height: '42px', minWidth: '140px' }}>
                <Search size={18} /> Search Requests
            </button>
          </div>
        </div>
      </div>

      {filteredList.length > 0 && (
        <div className="grid-card card">
          <div className="section-header">
            <h4 style={{ margin: 0, color: '#1e293b' }}>Pending Reviews ({filteredList.length})</h4>
            
            <div className="header-btn-group">
                <button 
                    onClick={() => handleBulkAction('APPROVED')}
                    className="btn btn-secondary"
                    style={{ color: '#059669', borderColor: '#a7f3d0', background: '#f0fdf4' }}
                >
                    <CheckSquare size={14} /> Accept All
                </button>
                <button 
                    onClick={() => handleBulkAction('REJECTED')}
                    className="btn btn-secondary"
                    style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                >
                    <XSquare size={14} /> Reject All
                </button>
                <button 
                    className={`btn btn-success ${loading ? 'btn-loading' : ''}`}
                    onClick={() => setShowConfirm(true)}
                    disabled={loading || Object.keys(sessionChanges).length === 0}
                    style={{ marginLeft: '8px' }}
                >
                    <Save size={16} /> <span>{loading ? '' : 'Save Decisions'}</span>
                </button>
            </div>
          </div>

          <AppDataGrid 
                dataSource={filteredList} 
                showActions={true}
                actionWidth={250}
                actionRender={(cellData) => (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => updateStatus(cellData.data.id, 'APPROVED')}
                            style={{ 
                                padding: '4px 10px', 
                                minHeight: 'auto',
                                fontSize: '12px',
                                background: sessionChanges[cellData.data.id] === 'APPROVED' ? '#10b981' : '', 
                                color: sessionChanges[cellData.data.id] === 'APPROVED' ? 'white' : '' 
                            }}
                        >
                            <CheckCircle size={14} /> Approve
                        </button>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => updateStatus(cellData.data.id, 'REJECTED')}
                            style={{ 
                                padding: '4px 10px', 
                                minHeight: 'auto',
                                fontSize: '12px',
                                background: sessionChanges[cellData.data.id] === 'REJECTED' ? '#ef4444' : '', 
                                color: sessionChanges[cellData.data.id] === 'REJECTED' ? 'white' : '' 
                            }}
                        >
                            <XCircle size={14} /> Reject
                        </button>
                        {sessionChanges[cellData.data.id] && (
                            <button className="undo-btn" onClick={() => {
                                const newChanges = { ...sessionChanges };
                                delete newChanges[cellData.data.id];
                                setSessionChanges(newChanges);
                            }}>
                                <Undo size={14} />
                            </button>
                        )}
                    </div>
                )}
            />
        </div>
      )}

      <ConfirmModal 
        isOpen={showConfirm}
        title="Save QC Decisions"
        message={`This will save ${Object.keys(sessionChanges).length} decisions to the system. Are you sure you want to perform this action?`}
        onConfirm={handleSaveDecisions}
        onCancel={() => setShowConfirm(false)}
      />

      <style>{`
        .action-btn-qc { border: none; padding: 6px 12px; border-radius: 4px; display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px; font-weight: 600; transition: 0.2s; }
        .action-btn-qc:hover { filter: brightness(0.95); }
        .undo-btn { background: none; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; padding: 4px; }
        .undo-btn:hover { color: #1e293b; }
      `}</style>
    </div>
  );
};

export default QCDecision;
