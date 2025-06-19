import React, { useState, useEffect } from 'react';
import ShiftCalendar from './ShiftCalendar';
import UserManagement from './UserManagement';
import Login from './Login'; // --- NEW: Import the Login component ---

function App() {
  const [currentPage, setCurrentPage] = useState('calendar');
  // --- UPDATED: loggedInUser now holds user data from the API ---
  const [loggedInUser, setLoggedInUser] = useState(null);

  // --- NEW: Check if user is already logged in from a previous session ---
  useEffect(() => {
    const storedUser = localStorage.getItem('rotaAppUser');
    if (storedUser) {
        setLoggedInUser(JSON.parse(storedUser));
    }
  }, []);

  // --- NEW: Function to handle successful login ---
  const handleLoginSuccess = (user) => {
    localStorage.setItem('rotaAppUser', JSON.stringify(user));
    setLoggedInUser(user);
  };

  // --- NEW: Function to handle logout ---
  const handleLogout = () => {
    localStorage.removeItem('rotaAppUser');
    setLoggedInUser(null);
    setCurrentPage('calendar'); // Reset to default page on logout
  };

  const navLinkStyle = {
    background: 'none', border: 'none', padding: '10px 15px',
    cursor: 'pointer', fontSize: '1rem', fontWeight: 500,
    borderRadius: '6px', transition: 'background-color 0.2s'
  };

  const activeLinkStyle = { ...navLinkStyle, backgroundColor: '#e9ecef', color: '#007bff' };

  // If no user is logged in, show only the Login component
  if (!loggedInUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // If a user is logged in, show the full application
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
                <button style={currentPage === 'userManagement' ? activeLinkStyle : navLinkStyle} onClick={() => setCurrentPage('userManagement')}>
                  User Management
                </button>
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
      https://my-rota-api.onrender.com
      <main style={{ padding: '20px' }}>
          {currentPage === 'calendar' && (
            <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}}>
                <ShiftCalendar loggedInUser={loggedInUser} />
            </div>
          )}
          
          {currentPage === 'userManagement' && loggedInUser.role === 'admin' && (
            <div style={{maxWidth: '800px', margin: '0 auto'}}>
               <UserManagement />
            </div>
          )}
      </main>
    </div>
  );
}

export default App;
