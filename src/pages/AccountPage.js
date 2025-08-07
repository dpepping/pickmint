import React from 'react';
import {jwtDecode} from 'jwt-decode';
import './AccountPage.css';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

function AccountPage() {
  const token = localStorage.getItem('token');
  let user = null;

  if (token) {
    try {
      user = jwtDecode(token);
      console.log('Decoded JWT payload:', user);
    } catch (err) {
      console.error('Invalid token:', err);
    }
  }

  if (!user) {
    return <p>You are not logged in.</p>;
  }

  const name =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name || user.userName || user.username || 'Name not found';
  const email = user.email || user.userEmail || 'Email not found';
  const userId = user.id || user._id || user.sub || 'ID not found';

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <div className="account-page">
          <h2>Account Information</h2>
          <div className="account-details card">
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>User ID:</strong> {userId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
