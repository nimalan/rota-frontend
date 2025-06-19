import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://my-rota-api.onrender.com';

// The Login component accepts a function `onLoginSuccess` as a prop,
// which it will call after a successful login.
function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        axios.post(`${API_URL}/login`, { email, password })
            .then(response => {
                // On success, call the function passed from the parent (App.js)
                // and pass the user data to it.
                onLoginSuccess(response.data);
            })
            .catch(error => {
                const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
                setError(errorMessage);
                console.error('Login error!', error);
            });
    };

    return (
        <div style={{
            maxWidth: '400px',
            margin: '50px auto',
            padding: '30px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ textAlign: 'center', marginTop: 0, marginBottom: '25px' }}>Login</h2>
            <form onSubmit={handleLogin}>
                {error && <p style={{ color: '#dc3545', background: '#f8d7da', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>{error}</p>}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>
                <button type="submit" className="modal-button modal-button-primary" style={{ width: '100%', fontSize: '1.1rem' }}>
                    Log In
                </button>
            </form>
        </div>
    );
}

export default Login;
