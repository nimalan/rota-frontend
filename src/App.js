import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ShiftCalendar from './ShiftCalendar';
import UserManagement from './UserManagement'; 
import RecurringShiftsManagement from './RecurringShiftsManagement'; // --- NEW: Import the component ---

const API_URL = 'https://my-rota-api.onrender.com'; // Replace with your actual Render URL

function App() {
  const [currentPage, setCurrentPage] = useState('calendar');
  const [users, setUsers] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    // Check for stored user on load
    const storedUser = localStorage.getItem('rotaAppUser');
    if (storedUser) {
        setLoggedInUser(JSON.parse(storedUser));
    }
    
    // Fetch users for login dropdown
    axios.get(`${API_URL}/users`)
        .then(response => { setUsers(response.data); })
        .catch(error => { console.error('Error fetching users for login!', error); });
  }, []);

  const handleLoginSuccess = (user) => {
    localStorage.setItem('rotaAppUser', JSON.stringify(user));
    setLoggedInUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('rotaAppUser');
    setLoggedInUser(null);
    setCurrentPage('calendar'); 
  };

  // Login component moved inside App for simplicity
  const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        axios.post(`${API_URL}/login`, { email, password })
            .then(response => { handleLoginSuccess(response.data); })
            .catch(err => { setError(err.response?.data?.message || 'Login failed.'); });
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginTop: 0, marginBottom: '25px' }}>Login</h2>
            <form onSubmit={handleLoginSubmit}>
                {error && <p style={{ color: '#dc3545', background: '#f8d7da', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>{error}</p>}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                <button type="submit" className="modal-button modal-button-primary" style={{ width: '100%', fontSize: '1.1rem' }}>Log In</button>
            </form>
        </div>
    );
  };

  const navLinkStyle = {
    background: 'none', border: 'none', padding: '10px 15px',
    cursor: 'pointer', fontSize: '1rem', fontWeight: 500,
    borderRadius: '6px', transition: 'background-color 0.2s', marginLeft: '5px'
  };

  const activeLinkStyle = { ...navLinkStyle, backgroundColor: '#e9ecef', color: '#007bff' };
  
  // Render Logic
  if (!loggedInUser) {
    return <Login />;
  }

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <header style={{ 
        backgroundColor: 'white', padding: '15px 30px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Rota Application</h1>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <nav>
              <button style={currentPage === 'calendar' ? activeLinkStyle : navLinkStyle} onClick={() => setCurrentPage('calendar')}>
                Calendar
              </button>
              {loggedInUser.role === 'admin' && (
                <>
                  {/* --- NEW: Recurring Shifts Page Link --- */}
                  <button style={currentPage === 'recurringShifts' ? activeLinkStyle : navLinkStyle} onClick={() => setCurrentPage('recurringShifts')}>
                    Recurring Shifts
                  </button>
                  <button style={currentPage === 'userManagement' ? activeLinkStyle : navLinkStyle} onClick={() => setCurrentPage('userManagement')}>
                    User Management
                  </button>
                </>
              )}
            </nav>
            <div style={{borderLeft: '1px solid #ddd', paddingLeft: '20px', display: 'flex', alignItems: 'center', gap: '15px'}}>
                <span style={{fontWeight: 500}}>Welcome, {loggedInUser.username}</span>
                <button onClick={handleLogout} className="modal-button modal-button-secondary">
                    Logout
                </button>
            </div>
        </div>
      </header>
      
      <main style={{ padding: '20px' }}>
        {currentPage === 'calendar' && (
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}}>
              <ShiftCalendar loggedInUser={loggedInUser} />
          </div>
        )}
        {currentPage === 'userManagement' && loggedInUser.role === 'admin' && (
          <div style={{maxWidth: '800px', margin: '0 auto'}}> <UserManagement /> </div>
        )}
        {/* --- NEW: Conditional rendering for the new page --- */}
        {currentPage === 'recurringShifts' && loggedInUser.role === 'admin' && (
          <div style={{maxWidth: '800px', margin: '0 auto'}}> <RecurringShiftsManagement /> </div>
        )}
      </main>
    </div>
  );
}

export default App;
