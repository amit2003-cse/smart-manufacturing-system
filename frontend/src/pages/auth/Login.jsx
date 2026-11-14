import React, { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { isAuthenticatedState } from '../../store/atoms';
import { Lock, User, LogIn, Eye, EyeOff, Zap, ShieldCheck, Key, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Login.scss';

const Login = () => {
  const setAuth = useSetRecoilState(isAuthenticatedState);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    
    const user = credentials.username.trim();
    const pass = credentials.password.trim();

    // Check credentials (allowing exact or standard case for admin to be user-friendly in interviews)
    if ((user.toLowerCase() === 'admin' || user === 'Admin') && pass === 'Admin@1234') {
      toast.success('Authentication successful! Welcome to Voltaic Cable MES.');
      setAuth(true);
      navigate('/');
    } else {
      toast.error('Invalid Username or Password! Please use the demo credentials below.');
      setIsSubmitting(false);
    }
  };

  const handleAutoFill = () => {
    setCredentials({
      username: 'Admin',
      password: 'Admin@1234'
    });
    toast.info('Demo credentials auto-filled! Click "Sign In" to proceed.');
  };

  return (
    <div className="login-page">
      {/* Background ambient lighting and subtle engineering grid */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>
      <div className="grid-overlay"></div>

      <div className="login-card fade-in">
        {/* Brand Header */}
        <div className="login-header">
          <div className="brand-badge">
            <span className="system-pill">
              <Zap size={13} className="pill-icon" /> SMART MES v2.4
            </span>
          </div>
          <div className="logo-container">
            <div className="logo-icon-wrap">
              <Zap size={28} className="logo-bolt" />
            </div>
            <div className="brand-titles">
              <h1 className="brand-name">
                <span className="brand-voltaic">VOLTAIC</span>
                <span className="brand-cable">CABLE</span>
              </h1>
              <p className="brand-sub">Smart Manufacturing & Floor Operations</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username-input">
              <User size={15} />
              <span>Username</span>
            </label>
            <div className="input-wrapper">
              <input 
                id="username-input"
                type="text" 
                placeholder="Enter username (e.g. Admin)"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    document.getElementById('password-input')?.focus();
                  }
                }}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password-input">
                <Lock size={15} />
                <span>Password</span>
              </label>
            </div>
            <div className="input-wrapper">
              <input 
                id="password-input"
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter password (e.g. Admin@1234)"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    document.getElementById('username-input')?.focus();
                  }
                }}
                autoComplete="current-password"
                required
              />
              <button 
                type="button" 
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={`login-btn ${isSubmitting ? 'submitting' : ''}`}
            disabled={isSubmitting}
          >
            <span>Sign In to Dashboard</span>
            <LogIn size={18} />
          </button>
        </form>

        {/* Interview / Demo Credentials Box */}
        <div className="demo-credentials-box">
          <div className="demo-header">
            <div className="demo-title">
              <Key size={15} className="demo-icon" />
              <span>Interview & Demo Access</span>
            </div>
            <button 
              type="button" 
              className="autofill-btn"
              onClick={handleAutoFill}
              title="Click to automatically fill credentials"
            >
              <Sparkles size={13} />
              <span>Auto-Fill</span>
            </button>
          </div>

          <div className="credentials-pills">
            <div 
              className="cred-pill"
              onClick={() => setCredentials(prev => ({ ...prev, username: 'Admin' }))}
              title="Click to fill Username"
            >
              <span className="cred-label">User:</span>
              <code className="cred-val">Admin</code>
            </div>
            <div 
              className="cred-pill"
              onClick={() => setCredentials(prev => ({ ...prev, password: 'Admin@1234' }))}
              title="Click to fill Password"
            >
              <span className="cred-label">Pass:</span>
              <code className="cred-val">Admin@1234</code>
            </div>
          </div>

          <p className="demo-hint">
            Click <strong>Auto-Fill</strong> above or enter credentials to inspect all manufacturing modules.
          </p>
        </div>

        {/* Security & System Info Footer */}
        <div className="login-footer">
          <ShieldCheck size={14} />
          <span>Voltaic Industrial OS • Enterprise Security</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
