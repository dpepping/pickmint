import React, { useState } from 'react';
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

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignup) {
      try {
        await axios.post('http://localhost:5000/api/signup', {
          firstName,
          lastName,
          gender,
          email,
          password,
        });
        alert('Signup successful!');
        setIsSignup(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Signup failed');
      }
    } else {
      try {
        const res = await axios.post('http://localhost:5000/api/login', {
          email,
          password,
        });
        console.log('JWT Token:', res.data.token);

        // Save the token in localStorage for future use
        localStorage.setItem('token', res.data.token);

        // Redirect to home page after successful login
        navigate('/home'); 
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed');
      }
    }
  };

  return (
    <div>
      <h1>{isSignup ? 'Sign Up' : 'Log In'}</h1>
      <form onSubmit={handleSubmit}>
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

      <p>
        {isSignup ? 'Already have an account?' : 'Don’t have an account?'}{' '}
        <button onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? 'Log In' : 'Sign Up'}
        </button>
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Auth;
