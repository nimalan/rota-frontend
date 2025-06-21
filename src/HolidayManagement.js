import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const API_URL = 'https://my-rota-api.onrender.com'; // Your live Render URL

function HolidayManagement({ loggedInUser }) {
    const [holidays, setHolidays] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state for new requests
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');

    const fetchHolidays = () => {
        axios.get(`${API_URL}/holidays`)
            .then(response => {
                setHolidays(response.data);
            })
            .catch(err => {
                console.error("Error fetching holidays", err);
                setError("Could not fetch holiday data.");
            });
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleRequestSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!startDate || !endDate) {
            setError("Start date and end date are required.");
            return;
        }

        const payload = {
            user_id: loggedInUser.id,
            start_date: startDate,
            end_date: endDate,
            notes: notes,
        };

        axios.post(`${API_URL}/holidays`, payload)
            .then(() => {
                setSuccess("Holiday request submitted successfully.");
                fetchHolidays(); // Refresh the list
                setStartDate('');
                setEndDate('');
                setNotes('');
            })
            .catch(err => {
                console.error("Error submitting holiday request", err);
                setError("Failed to submit request.");
            });
    };
    
    const handleUpdateRequest = (id, status) => {
        axios.put(`${API_URL}/holidays/${id}`, { status })
            .then(() => {
                setSuccess(`Request has been ${status}.`);
                fetchHolidays(); // Refresh the list
            })
            .catch(err => {
                console.error("Error updating holiday request", err);
                setError("Failed to update request.");
            });
    };

    const myRequests = holidays.filter(h => h.user_id === loggedInUser.id);
    const pendingRequests = holidays.filter(h => h.status === 'pending');

    const statusStyle = (status) => {
        if (status === 'approved') return { color: 'white', backgroundColor: '#28a745', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem' };
        if (status === 'rejected') return { color: 'white', backgroundColor: '#dc3545', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem' };
        return { color: '#333', backgroundColor: '#ffc107', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem' };
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            {/* Column 1: Request Form and My Requests */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
                    <h3 style={{ marginTop: 0 }}>Request Time Off</h3>
                    <form onSubmit={handleRequestSubmit}>
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        {success && <p style={{ color: 'green' }}>{success}</p>}
                        <div style={{ marginBottom: '10px' }}>
                            <label>Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label>Notes (optional)</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '60px' }} />
                        </div>
                        <button type="submit" className="modal-button modal-button-primary">Submit Request</button>
                    </form>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
                    <h3 style={{ marginTop: 0 }}>My Holiday Requests</h3>
                    <ul>
                        {myRequests.map(req => (
                            <li key={req.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                <span>{moment(req.start_date).format('MMM D, YYYY')} - {moment(req.end_date).format('MMM D, YYYY')}</span>
                                <span style={statusStyle(req.status)}>{req.status}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Column 2: Admin Panel */}
            {loggedInUser.role === 'admin' && (
                <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
                    <h3 style={{ marginTop: 0 }}>Pending Holiday Requests</h3>
                    <ul>
                        {pendingRequests.map(req => (
                            <li key={req.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                <div><strong>{req.user.username}</strong>: {moment(req.start_date).format('MMM D')} - {moment(req.end_date).format('MMM D, YYYY')}</div>
                                {req.notes && <div style={{fontSize: '0.9em', color: '#666', margin: '4px 0'}}>Notes: {req.notes}</div>}
                                <div style={{marginTop: '8px'}}>
                                    <button onClick={() => handleUpdateRequest(req.id, 'approved')} className="modal-button modal-button-primary" style={{marginRight: '10px'}}>Approve</button>
                                    <button onClick={() => handleUpdateRequest(req.id, 'rejected')} className="modal-button modal-button-danger">Reject</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default HolidayManagement;
