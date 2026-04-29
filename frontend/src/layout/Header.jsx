import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { sidebarState, userState } from '../store/atoms';
import { Menu, User, Bell } from 'lucide-react';

const Header = () => {
  const [isSidebarOpen, setSidebarOpen] = useRecoilState(sidebarState);
  const user = useRecoilValue(userState);

  return (
    <header className="main-header">
      <div className="left-section">
        <button 
          className="toggle-btn" 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Close Menu" : "Open Menu"}
        >
          <Menu size={20} />
        </button>
        <div className="logo">
          <span className="logo-text" style={{ color: '#d32f2f' }}>VOLTAIC</span>
          <span className="logo-subtext">CABLE</span>
        </div>
      </div>

      <div className="right-section">
        <button className="icon-btn"><Bell size={18} /></button>
        <div className="user-profile">
          <span className="username">{user.name}</span>
          <div className="avatar">
            <User size={16} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
