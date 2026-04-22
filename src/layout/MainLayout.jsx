import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useRecoilState, useRecoilValue } from 'recoil';
import { sidebarState } from '../store/atoms';
import './MainLayout.scss';
import { useLocation } from 'react-router-dom'; 

const MainLayout = ({ children }) => {
  const [isOpen, setSidebarOpen] = useRecoilState(sidebarState);
  const location = useLocation();

  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <div className={`app-container ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Header />
      <div className="content-wrapper">
        {isOpen && <div className="mobile-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
        <Sidebar />
        <main className="main-content">
          <div className="content-scroll-container">
            <div className="breadcrumb-container">
              <span className="crumb">Home</span>
              {pathnames.map((name, index) => (
                <span key={index}>
                  <span className="separator"> &gt; </span>
                  <span className="crumb capitalize">{name.replace('-', ' ')}</span>
                </span>
              ))}
            </div>
            <div className="page-wrapper">
              {children}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
