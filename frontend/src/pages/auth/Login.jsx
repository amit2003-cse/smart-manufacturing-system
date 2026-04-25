import React, { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { isAuthenticatedState } from '../../store/atoms';
import { Lock, User, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Import toast
import './Login.scss';

const Login = () => {
  const setAuth = useSetRecoilState(isAuthenticatedState);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    const { username, password } = credentials;

    // Credentials check logic
    if (username === 'Admin' && password === 'Admin@1234') {
      toast.success('Login Successful! Welcome Admin.');
      setAuth(true);
      navigate("/");
    } else {
      toast.error('Invalid Username or Password! Please try again.');
    }
  };

  return (
    <div className="login-page">
      {/* ... baaki JSX wahi rahega jo pehle tha ... */}
      <div className="login-card fade-in">
        <div className="login-header">
          <div className="logo-icon"><LogIn size={32} /></div>
          <h2>Fresh Logistics</h2>
          <p>Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label><User size={16} /> Username</label>
            <input 
              type="text" 
              placeholder="username"
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  document.getElementById('password-input').focus();
                }
              }}
              required
            />
          </div>

          <div className="form-group">
            <label><Lock size={16} /> Password</label>
            <input 
              id="password-input"
              type="password" 
              placeholder="******"
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin(e);
                } else if (e.key === 'ArrowUp') {
                  document.querySelector('input[type="text"]').focus();
                }
              }}
              required
            />
          </div>

          <button type="submit" className="login-btn">Sign In</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
