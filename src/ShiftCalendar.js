import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment'; // Using standard moment
import 'moment/locale/en-gb';
import axios from 'axios';
import Modal from 'react-modal';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

// Import D&D and base calendar CSS
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// FINAL-VERSION-CHECK-CALENDAR-V25
moment.locale('en-gb');
const DraggableCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);
const API_URL = 'https://my-rota-api.onrender.com'; // Your Live Render URL

Modal.setAppElement('#root');

// A simplified style object for the modal
const customStyles = {
    content: {
        top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        marginRight: '-50%', transform: 'translate(-50%, -50%)',
        width: '400px', padding: '20px', borderRadius: '8px'
    },
};

function ShiftCalendar({ loggedInUser }) {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);

    // Form state for a simple shift
    const [shiftDate, setShiftDate] = useState('');
    const [shiftStartTime, setShiftStartTime] = useState('09:00');
    const [shiftEndTime, setShiftEndTime] = useState('17:00');
    const [selectedUserId, setSelectedUserId] = useState('');

    // --- NEW: State to track which shift is being edited ---
    const [editingEvent, setEditingEvent] = useState(null);


    const formatEvent = useCallback((shift) => ({
        id: `shift-${shift.id}`,
        title: shift.user ? shift.user.username : 'Unassigned',
        start: new Date(shift.start_time),
        end: new Date(shift.end_time),
        userId: shift.user_id,
    }), []);

    const fetchShifts = useCallback(() => {
        const start = moment().startOf('month').startOf('week').toISOString();
        const end = moment().endOf('month').endOf('week').toISOString();

        axios.get(`${API_URL}/shifts`, { params: { start_date: start, end_date: end } })
            .then(res => {
                const formatted = res.data.map(formatEvent);
                setEvents(formatted);
            })
            .catch(err => console.error('Error fetching shifts', err));
    }, [formatEvent]);
    
    useEffect(() => {
        if(loggedInUser) {
            axios.get(`${API_URL}/users`).then(res => setUsers(res.data));
            fetchShifts();
        }
    }, [loggedInUser, fetchShifts]);

    const handleSelectSlot = (slotInfo) => {
        setEditingEvent(null); // Ensure we are in "create" mode
        setShiftDate(moment(slotInfo.start).format('YYYY-MM-DD'));
        setShiftStartTime(moment(slotInfo.start).format('HH:mm'));
        setShiftEndTime(moment(slotInfo.end).format('HH:mm'));
        setSelectedUserId('');
        setModalIsOpen(true);
    };

    // --- NEW: Function to handle clicking on an existing event ---
    const handleSelectEvent = (event) => {
        setEditingEvent(event); // Store the event being edited
        setShiftDate(moment(event.start).format('YYYY-MM-DD'));
        setShiftStartTime(moment(event.start).format('HH:mm'));
        setShiftEndTime(moment(event.end).format('HH:mm'));
        setSelectedUserId(event.userId || '');
        setModalIsOpen(true);
    };

    // --- UPDATED: This function now handles both Create and Update ---
    const handleSave = () => {
        const payload = {
            start_time: moment.utc(`${shiftDate}T${shiftStartTime}`).toISOString(),
            end_time: moment.utc(`${shiftDate}T${shiftEndTime}`).toISOString(),
            user_id: selectedUserId ? parseInt(selectedUserId) : null,
        };

        const request = editingEvent
            ? axios.put(`${API_URL}/shifts/${editingEvent.id.replace('shift-', '')}`, payload)
            : axios.post(`${API_URL}/shifts`, payload);

        request
            .then(() => {
                fetchShifts();
                closeModal();
            })
            .catch(err => {
                console.error("Error saving shift", err);
                alert("Could not save shift.");
            });
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setEditingEvent(null); // Clear the editing state
    };

    return (
        <div>
            <div style={{ height: '80vh' }}>
                <DraggableCalendar
                    localizer={localizer}
                    events={events}
                    defaultView="week"
                    style={{ height: "100%" }}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent} // --- NEW: Handle event clicks ---
                    selectable
                />
            </div>

            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} style={customStyles} contentLabel="Shift Modal">
                {/* --- UPDATED: Modal title changes based on editing state --- */}
                <h2>{editingEvent ? 'Edit Shift' : 'Add Shift'}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <label>Date: <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} /></label>
                    <label>Start Time: <input type="time" value={shiftStartTime} onChange={e => setShiftStartTime(e.target.value)} /></label>
                    <label>End Time: <input type="time" value={shiftEndTime} onChange={e => setShiftEndTime(e.target.value)} /></label>
                    <label>Assign User:
                        <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                            <option value="">Unassigned</option>
                            {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                        </select>
                    </label>
                </div>
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button onClick={closeModal} style={{ marginRight: '10px' }}>Cancel</button>
                    <button onClick={handleSave} style={{ fontWeight: 'bold' }}>Save</button>
                </div>
            </Modal>
        </div>
    );
}

export default ShiftCalendar;
