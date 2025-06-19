import React, { useState, useEffect } from 'react';
import axios from 'axios';

// The URL of our Flask backend API
const API_URL = 'https://my-rota-api.onrender.com'';

function UserList() {
    // useState is a hook to hold component data (state)
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');

    // useEffect is a hook to run code on component load
    useEffect(() => {
        // Fetch users from the backend API
        axios.get(`${API_URL}/users`)
            .then(response => {
                // On success, update the users state
                setUsers(response.data);
            })
            .catch(error => {
                // On failure, set an error message
                console.error('There was an error fetching the users!', error);
                setError('Could not fetch users. Is the backend server running?');
            });
    }, []); // The empty array means this effect runs once on component mount

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div>
            <h2>Users</h2>
            <ul>
                {users.map(user => (
                    <li key={user.id}>
                        <strong>{user.username}</strong> ({user.role}) - {user.email}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default UserList;