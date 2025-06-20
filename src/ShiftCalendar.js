import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://my-rota-api.onrender.com'; // Replace with your actual Render URL

function RecurringShiftsManagement() {
    const [users, setUsers] = useState([]);
    const [recurringShifts, setRecurringShifts] = useState([]);
    
    // State for the form
    const [selectedUserId, setSelectedUserId] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState('0'); // 0 = Monday
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // Fetch initial data (users and existing templates)
    useEffect(() => {
        const fetchUsers = axios.get(`${API_URL}/users`);
        const fetchRecurringShifts = axios.get(`${API_URL}/recurring-shifts`);

        Promise.all([fetchUsers, fetchRecurringShifts])
            .then(([usersResponse, recurringShiftsResponse]) => {
                setUsers(usersResponse.data);
                setRecurringShifts(recurringShiftsResponse.data);
            })
            .catch(error => {
                console.error('Error fetching data!', error);
                setError('Could not load initial data.');
            });
    }, []);

    const handleAddTemplate = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedUserId) {
            setError('Please select a user.');
            return;
        }

        const newTemplate = {
            user_id: parseInt(selectedUserId),
            day_of_week: parseInt(dayOfWeek),
            start_time: startTime,
            end_time: endTime,
        };

        axios.post(`${API_URL}/recurring-shifts`, newTemplate)
            .then(response => {
                setRecurringShifts(prev => [...prev, response.data].sort((a,b) => a.day_of_week - b.day_of_week));
                setSuccess('New recurring shift template added successfully!');
                setSelectedUserId('');
            })
            .catch(error => {
                console.error('Error adding template!', error);
                setError(error.response?.data?.message || 'Could not add template.');
            });
    };

    const handleDeleteTemplate = (templateId) => {
        if (window.confirm('Are you sure you want to delete this recurring shift template?')) {
            axios.delete(`${API_URL}/recurring-shifts/${templateId}`)
                .then(() => {
                    setRecurringShifts(prev => prev.filter(t => t.id !== templateId));
                    setSuccess('Template deleted successfully.');
                })
                .catch(error => {
                    console.error('Error deleting template!', error);
                    setError('Could not delete template.');
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
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Manage Recurring Shifts</h3>
            
            <form onSubmit={handleAddTemplate} style={{ marginBottom: '20px' }}>
                <h4 style={{marginTop: 0, marginBottom: '15px'}}>Add New Template</h4>
                {error && <p style={{ color: '#dc3545', background: '#f8d7da', padding: '10px', borderRadius: '6px' }}>{error}</p>}
                {success && <p style={{ color: '#155724', background: '#d4edda', padding: '10px', borderRadius: '6px' }}>{success}</p>}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>User</label>
                        <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'white'}}>
                            <option value="">-- Select a User --</option>
                            {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Day of the Week</label>
                        <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'white'}}>
                            {days.map((day, index) => <option key={index} value={index}>{day}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Start Time</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>End Time</label>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}} />
                    </div>
                </div>
                <button type="submit" className="modal-button modal-button-primary">Add Template</button>
            </form>

            <hr style={{border: 'none', borderTop: '2px solid #eee', margin: '20px 0'}}/>

            <div>
                <h4 style={{marginTop: 0, marginBottom: '15px'}}>Existing Templates</h4>
                <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                    {recurringShifts.map(template => (
                        <li key={template.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee' }}>
                            <div>
                                <span style={{fontWeight: 600}}>{template.user.username}</span> on <span style={{fontWeight: 600}}>{days[template.day_of_week]}</span>
                                <span style={{color: '#555', marginLeft: '10px'}}>({template.start_time.substring(0,5)} - {template.end_time.substring(0,5)})</span>
                            </div>
                            <button 
                                onClick={() => handleDeleteTemplate(template.id)}
                                style={{background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', fontSize: '1.4rem', fontWeight: 'bold'}}
                                title={`Delete template for ${template.user.username}`}
                            >
                                &times;
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default RecurringShiftsManagement;
