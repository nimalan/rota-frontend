import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://my-rota-api.onrender.com'; // Replace with your actual Render URL

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); 
    const [role, setRole] = useState('employee');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchUsers = () => {
        axios.get(`${API_URL}/users`)
            .then(response => {
                setUsers(response.data);
            })
            .catch(error => {
                console.error('Error fetching users!', error);
                setError('Could not load users.');
            });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!username || !email || !password) {
            setError('Username, email, and password are required.');
            return;
        }

        const newUser = { username, email, password, role };

        axios.post(`${API_URL}/users`, newUser)
            .then(response => {
                setUsers(prevUsers => [...prevUsers, response.data]);
                setUsername('');
                setEmail('');
                setPassword(''); 
                setRole('employee');
                setSuccess(`Successfully added user: ${response.data.username}`);
            })
            .catch(error => {
                console.error('Error adding user!', error);
                const errorMessage = error.response?.data?.message || 'Could not add user.';
                setError(errorMessage);
            });
    };

    const handleDeleteUser = (userId, userUsername) => {
        const adminCount = users.filter(u => u.role === 'admin').length;
        const userToDelete = users.find(u => u.id === userId);

        if (userToDelete && userToDelete.role === 'admin' && adminCount <= 1) {
            alert('Cannot delete the last remaining admin.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete the user "${userUsername}"? This cannot be undone.`)) {
            axios.delete(`${API_URL}/users/${userId}`)
                .then(() => {
                    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
                    setSuccess(`Successfully deleted user: ${userUsername}`);
                })
                .catch(error => {
                    console.error('Error deleting user!', error);
                    setError('Could not delete user.');
                });
        }
    };

    return (
        <div style={{ 
            padding: '20px', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
        }}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>User Management</h3>
            
            <form onSubmit={handleAddUser} style={{ marginBottom: '20px' }}>
                <h4 style={{marginTop: 0, marginBottom: '15px'}}>Add New User</h4>
                {error && <p style={{ color: '#dc3545', background: '#f8d7da', padding: '10px', borderRadius: '6px' }}>{error}</p>}
                {success && <p style={{ color: '#155724', background: '#d4edda', padding: '10px', borderRadius: '6px' }}>{success}</p>}
                
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}/>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}/>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}/>
                </div>
                 <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'white'}}>
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button type="submit" className="modal-button modal-button-primary">Add User</button>
            </form>

            <hr style={{border: 'none', borderTop: '2px solid #eee', margin: '20px 0'}}/>

            <div>
                <h4 style={{marginTop: 0, marginBottom: '15px'}}>Existing Users</h4>
                <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                    {users.map(user => (
                        <li key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                            <div>
                                <span style={{fontWeight: 500}}>{user.username}</span>
                                <span style={{color: '#666'}}> ({user.email})</span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <span style={{ background: user.role === 'admin' ? '#007bff' : '#6c757d', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem', textTransform: 'capitalize' }}>{user.role}</span>
                                <button 
                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                    style={{background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', fontSize: '1.2rem', fontWeight: 'bold'}}
                                    title={`Delete ${user.username}`}
                                >
                                    &times;
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default UserManagement;
