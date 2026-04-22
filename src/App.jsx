import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { isAuthenticatedState } from './store/atoms';

// 1. Toastify ke ye dono cheezein import karein
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/auth/Login';
import MainLayout from './layout/MainLayout';
import Home from './pages/home/Home';
import GenerateShipper from './pages/shipper/GenerateShipper';
import ScanShipper from './pages/shipper/ScanShipper';
import LargeBoxPacker from './pages/shipper/LargeBoxPacker';
import DeliveryScan from './pages/delivery/DeliveryScan';
import QCRequest from './pages/qc/QCRequest';
import QCDecision from './pages/qc/QCDecision';
import './styles/theme.scss';
import 'devextreme/dist/css/dx.light.css';

function App() {
  const isAuthenticated = useRecoilValue(isAuthenticatedState);

  return (
    <Router>
      {/* 2. ToastContainer yahan add karein */}
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        theme="colored" 
      />

      {!isAuthenticated ? (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/home" element={<Home />} />
            <Route path="/shipper/generate" element={<GenerateShipper />} />
            <Route path="/shipper/scan" element={<ScanShipper />} />
            <Route path="/shipper/packaging" element={<LargeBoxPacker />} />
            <Route path="/delivery/scan" element={<DeliveryScan />} />
            <Route path="/qc/request" element={<QCRequest />} />
            <Route path="/qc/decision" element={<QCDecision />} />
          </Routes>
        </MainLayout>
      )}
    </Router>
  );
}

export default App;
