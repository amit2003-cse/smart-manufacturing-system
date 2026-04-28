import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRecoilValue } from 'recoil';

import { masterData } from '../../data/masterData';
import { unitBoxesDBState, combinedBoxesDBState } from '../../store/atoms';
import AppSelect from '../../components/shared/AppSelect';
import AppDataGrid from '../../components/shared/AppDataGrid';

const DeliveryReport = () => {
  const [selectedItem, setSelectedItem] = useState(() => sessionStorage.getItem('rpt_del_item') || null);
  const [selectedBatch, setSelectedBatch] = useState(() => sessionStorage.getItem('rpt_del_batch') || null);
  const [displayData, setDisplayData] = useState(() => {
    const saved = sessionStorage.getItem('rpt_del_data');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    sessionStorage.setItem('rpt_del_item', selectedItem || '');
    sessionStorage.setItem('rpt_del_batch', selectedBatch || '');
    sessionStorage.setItem('rpt_del_data', JSON.stringify(displayData));
  }, [selectedItem, selectedBatch, displayData]);

  const unitBoxesDB = useRecoilValue(unitBoxesDBState);
  const combinedBoxesDB = useRecoilValue(combinedBoxesDBState);

  const availableBatches = useMemo(() => {
    const item = masterData.find(i => i.itemCode === selectedItem);
    return item ? item.batches : [];
  }, [selectedItem]);

  const getDeliveryStatus = (itemCode, batchCode, boxNo) => {
    // First find the unit box
    const unit = unitBoxesDB.find(
      b => b.itemCode === itemCode && b.batchCode === batchCode && b.boxNo === boxNo
    );

    if (!unit) return { text: 'Not Done', color: '#ef4444', bg: '#fef2f2' };

    // Check if this unit is packed in any combined box
    const parentCarton = combinedBoxesDB.find(carton => 
      carton.unitBoxes && carton.unitBoxes.some(u => u.barcode === unit.barcode)
    );

    if (parentCarton) return { text: 'Done', color: '#10b981', bg: '#f0fdf4' };
    if (unit.isPacked) return { text: 'Pending for Delivery', color: '#f59e0b', bg: '#fffbeb' };
    return { text: 'Not Done', color: '#ef4444', bg: '#fef2f2' };
  };

  const handleSearch = () => {
    if (!selectedItem || !selectedBatch) return;

    const itemInfo = masterData.find(i => i.itemCode === selectedItem);
    if (!itemInfo) {
      toast.error("Item not found.");
      return;
    }

    const reportData = [];
    for (let i = 1; i <= itemInfo.boxCapacity; i++) {
      const status = getDeliveryStatus(selectedItem, selectedBatch, i);
      reportData.push({
        sNo: i,
        itemCode: selectedItem,
        batchCode: selectedBatch,
        boxNo: i,
        status: status.text,
        statusColor: status.color,
        statusBg: status.bg,
      });
    }

    setDisplayData(reportData);
    if (reportData.length === 0) toast.info("No data found for this selection.");
  };

  const handleExportCSV = () => {
    if (displayData.length === 0) return;
    const headers = ['S.No', 'Item Code', 'Batch Code', 'Unit Box', 'Status'];
    let csvContent = headers.join(",") + "\n";
    displayData.forEach((row) => {
      csvContent += [row.sNo, row.itemCode, row.batchCode, row.boxNo, `"${row.status}"`].join(",") + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Delivery_Report_${selectedItem}_${selectedBatch}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary counts
  const summary = useMemo(() => {
    const done = displayData.filter(d => d.status === 'Done').length;
    const pending = displayData.filter(d => d.status === 'Pending for Delivery').length;
    const notDone = displayData.filter(d => d.status === 'Not Done').length;
    return { done, pending, notDone, total: displayData.length };
  }, [displayData]);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Delivery Report</h2>
        <p className="help-text">
          Track the delivery and dispatch status of all unit boxes. View which units have been packed into master spools and dispatched.
        </p>
      </div>

      <div className="filter-card card no-print">
        <div className="filter-grid">
          <AppSelect 
            label="Item Code"
            dataSource={masterData.map(i => i.itemCode)} 
            value={selectedItem}
            onValueChanged={(e) => {
              setSelectedItem(e.value);
              setSelectedBatch(null);
              setDisplayData([]);
            }}
            placeholder="Select Item..." 
          />
          <AppSelect 
            label="Batch Code"
            dataSource={availableBatches} 
            value={selectedBatch}
            onValueChanged={(e) => {
              setSelectedBatch(e.value);
              setDisplayData([]);
            }}
            disabled={!selectedItem}
            placeholder="Select Batch..." 
          />
          <div className="filter-actions" style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSearch} disabled={!selectedBatch} style={{ height: '42px', minWidth: '140px' }}>
              <Search size={18} /> Search
            </button>
          </div>
        </div>
      </div>

      {displayData.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="report-summary-row">
            <div className="summary-card" style={{ borderLeftColor: '#10b981' }}>
              <span className="summary-value">{summary.done}</span>
              <span className="summary-label">Delivered</span>
            </div>
            <div className="summary-card" style={{ borderLeftColor: '#f59e0b' }}>
              <span className="summary-value">{summary.pending}</span>
              <span className="summary-label">Pending</span>
            </div>
            <div className="summary-card" style={{ borderLeftColor: '#ef4444' }}>
              <span className="summary-value">{summary.notDone}</span>
              <span className="summary-label">Not Done</span>
            </div>
            <div className="summary-card" style={{ borderLeftColor: '#3b82f6' }}>
              <span className="summary-value">{summary.total}</span>
              <span className="summary-label">Total</span>
            </div>
          </div>

          <div className="grid-card card">
            <div className="section-header">
              <h4 style={{ margin: 0, color: '#1e293b' }}>
                <Truck size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Delivery Status ({displayData.length} Units)
              </h4>
              <button className="btn btn-secondary" onClick={handleExportCSV}>
                <Download size={16} /> Export CSV
              </button>
            </div>
            <AppDataGrid 
              dataSource={displayData}
              showActions={true}
              actionWidth={200}
              hideBarcode={true}
              actionRender={(cellData) => (
                <span className="status-badge" style={{ 
                  background: cellData.data.statusBg, 
                  color: cellData.data.statusColor,
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-block',
                }}>
                  {cellData.data.status}
                </span>
              )}
            />
          </div>
        </>
      )}

      {displayData.length === 0 && (
        <div className="no-data-msg" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '50%' }}>
            <Truck size={48} />
          </div>
          <span>Select Item and Batch, then click Search to generate the delivery report.</span>
        </div>
      )}

      <style>{`
        .report-summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 20px; }
        .summary-card { background: white; border-radius: 12px; padding: 16px 20px; border-left: 4px solid; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .summary-value { font-size: 28px; font-weight: 800; color: #1e293b; }
        .summary-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
      `}</style>
    </div>
  );
};

export default DeliveryReport;
