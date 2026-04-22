import React, { useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { sidebarState, isAuthenticatedState } from '../store/atoms';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Scan, LogOut, ChevronDown, ChevronRight, Factory, CheckCircle2, AlertCircle, CheckCircle } from 'lucide-react';

const Sidebar = () => {
  const isOpen = useRecoilValue(sidebarState);
  const setAuth = useSetRecoilState(isAuthenticatedState);
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState('production'); // Default open

  const setSidebarOpen = useSetRecoilState(sidebarState);

  const menuItems = [
    { name: 'Home', path: '/home', icon: <LayoutDashboard size={20} /> },
    { 
      name: 'Production', 
      id: 'production',
      icon: <Factory size={20} />, 
      subItems: [
        { name: 'Generate Shipper', path: '/shipper/generate', icon: <Package size={18} /> },
        { name: 'Scan Shipper', path: '/shipper/scan', icon: <Scan size={18} /> },
      ]
    },
    {
      name: 'Quality Control',
      id: 'qc',
      icon: <CheckCircle2 size={20} />,
      subItems: [
        { name: 'QC Request', path: '/qc/request', icon: <AlertCircle size={18} /> },
        { name: 'QC Decision', path: '/qc/decision', icon: <CheckCircle size={18} /> },
      ]
    },
    { 
      name: 'Delivery', 
      id: 'delivery',
      icon: <Package size={20} />, 
      subItems: [
        { name: 'Packaging', path: '/shipper/packaging', icon: <Package size={18} /> },
        { name: 'Delivery Scanning', path: '/delivery/scan', icon: <Scan size={18} /> },
      ]
    },
  ];

  const toggleSubmenu = (id) => {
    if (!isOpen) {
      setSidebarOpen(true);
      setOpenSubmenu(id);
    } else {
      setOpenSubmenu(openSubmenu === id ? null : id);
    }
  };

  const handleItemClick = () => {
    if (!isOpen) setSidebarOpen(true);
  };

  return (
    <aside className={`main-sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <nav className="nav-menu">
        {menuItems.map((item) => {
          const isParentActive = item.subItems?.some(sub => location.pathname.includes(sub.path));
          // Removed unused isActive

          return (
            <div key={item.name} className="menu-group">
              {item.subItems ? (
                <>
                  <div 
                    className={`nav-item submenu-header ${openSubmenu === item.id || isParentActive ? 'active' : ''}`}
                    onClick={() => toggleSubmenu(item.id)}
                    title={!isOpen ? item.name : ''}
                  >
                    <div className="item-main">
                      {item.icon}
                      {isOpen && <span>{item.name}</span>}
                    </div>
                    {isOpen && (openSubmenu === item.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                  </div>
                  
                  {isOpen && openSubmenu === item.id && (
                    <div className="sub-menu-items">
                      {item.subItems.map(sub => (
                        <NavLink 
                          key={sub.path} 
                          to={sub.path} 
                          onClick={handleItemClick}
                          className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                          {sub.icon}
                          <span>{sub.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink 
                  to={item.path} 
                  onClick={handleItemClick}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  title={!isOpen ? item.name : ''}
                >
                  {item.icon}
                  {isOpen && <span>{item.name}</span>}
                </NavLink>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={() => setAuth(false)}>
          <LogOut size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
