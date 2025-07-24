import './Auth.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    /*  const baseURL = process.env.REACT_APP_API_URL;
    console.log('API base URL:', baseURL);
    console.log('API base URL:', process.env.REACT_APP_API_URL);
    console.log('REACT_APP_API_URL from env:', process.env.REACT_APP_API_URL);
    console.log('All env vars:', process.env); */

    try {


      if (isSignup) {
        //const res = await axios.post('https://pickmint-fb40314ffafe.herokuapp.com/api/signup', {
          const res = await axios.post('http://localhost:5000/api/signup', {
        firstName, lastName, gender, email, password,
        });
        setSuccessMessage(res.data.message || 'Signup successful!');
        setIsSignup(false);
      } else {
        //const res = await axios.post('https://pickmint-fb40314ffafe.herokuapp.com/api/login', { email, password });
        const res = await axios.post('http://localhost:5000/api/login', { email, password });
        localStorage.setItem('token', res.data.token);
        navigate('/index');
      }
    } catch (err) {
      setError(err.response?.data?.message || (isSignup ? 'Signup failed' : 'Login failed'));
    }
  };

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="auth-container">
      {successMessage && (
        <div className="auth-toast">
          {successMessage}
        </div>
      )}

      <div className="auth-box">
        <h2 className="auth-header">Welcome to PickMint</h2>

        <div className="auth-card">
          <h1 className="auth-title">{isSignup ? 'Sign Up' : 'Log In'}</h1>
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup && (
              <>
                <div>
                  <label>First Name:</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Last Name:</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Gender:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">{isSignup ? 'Sign Up' : 'Log In'}</button>
          </form>
          <div className="auth-toggle">
            <p>
              {isSignup ? 'Already have an account?' : 'Don’t have an account?'}{' '}
              <button onClick={() => setIsSignup(!isSignup)}>
                {isSignup ? 'Log In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
