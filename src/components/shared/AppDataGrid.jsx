import React, { useState, useEffect } from 'react';
import { DataGrid, Column, Paging, Scrolling, Export, ColumnChooser } from 'devextreme-react/data-grid';

const AppDataGrid = ({ 
  dataSource, 
  height, 
  showActions = false, 
  actionRender, 
  actionWidth = 80,
  allowExport = false 
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-datagrid-container" style={{ height: height || '100%', display: 'flex', flexDirection: 'column' }}>
      <DataGrid 
        dataSource={dataSource} 
        showBorders={false}
        columnAutoWidth={!isMobile}
        rowAlternationEnabled={true}
        height="100%"
        width="100%"
      >
        <Scrolling mode="standard" showScrollbar="always" useNative={isMobile} />
        <Paging enabled={true} defaultPageSize={5} />
        {allowExport && <Export enabled={true} formats={['csv']} allowExportSelectedData={false} />}
        {isMobile && <ColumnChooser enabled={true} mode="select" />}
        
        {/* Standardized Columns */}
        <Column dataField="itemCode" caption="Item Code" minWidth={100} />
        <Column dataField="batchCode" caption="Batch Code" minWidth={100} />
        
        {/* Unit Box / Box Number */}
        <Column 
          caption="Unit Box" 
          width={100}
          alignment="center"
          calculateCellValue={(rowData) => {
            // Priority 1: Explicit boxNo
            if (rowData.boxNo) return rowData.boxNo;
            // Priority 2: Extract from barcode (Format: ITEM-BATCH-BOXNO)
            if (rowData.barcode && rowData.barcode.includes('-')) {
                const segments = rowData.barcode.split('-');
                return segments[segments.length - 1];
            }
            // Priority 3: Extract from ID
            if (rowData.id && rowData.id.includes('-')) {
                return rowData.id.split('-').pop();
            }
            return '-';
          }} 
        />
        
        <Column dataField="barcode" caption="Barcode" minWidth={150} />
        
        {/* Dynamic Action Column */}
        {showActions && (
          <Column 
            caption="Action" 
            width={actionWidth} 
            alignment="center"
            cellRender={actionRender}
            fixed={true}
            fixedPosition="right"
            cssClass="action-col-sticky"
          />
        )}
      </DataGrid>
    </div>
  );
};

export default AppDataGrid;
