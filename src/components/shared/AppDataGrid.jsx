import React from 'react';
import { DataGrid, Column, Paging, Scrolling, Export } from 'devextreme-react/data-grid';

const AppDataGrid = ({ 
  dataSource, 
  height, 
  showActions = false, 
  actionRender, 
  actionWidth = 80,
  allowExport = false 
}) => {
  return (
    <div className="app-datagrid-container" style={{ height: height || '100%', display: 'flex', flexDirection: 'column' }}>
      <DataGrid 
        dataSource={dataSource} 
        showBorders={false}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        height="100%"
        width="100%"
      >
        <Scrolling mode="standard" />
        <Paging enabled={true} defaultPageSize={5} />
        {allowExport && <Export enabled={true} formats={['csv']} allowExportSelectedData={false} />}
        
        {/* Standardized Columns */}
        <Column dataField="itemCode" caption="Item Code" />
        <Column dataField="batchCode" caption="Batch Code" />
        
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
        
        <Column dataField="barcode" caption="Barcode" />
        
        {/* Dynamic Action Column */}
        {showActions && (
          <Column 
            caption="Action" 
            width={actionWidth} 
            alignment="center"
            cellRender={actionRender}
          />
        )}
      </DataGrid>
    </div>
  );
};

export default AppDataGrid;
