import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment'; // Using standard moment
import 'moment/locale/en-gb';
import axios from 'axios';
import Modal from 'react-modal';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

// Import D&D and base calendar CSS
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// FINAL-VERSION-CHECK-CALENDAR-V28
moment.locale('en-gb');
const DraggableCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);
const API_URL = 'https://my-rota-api.onrender.com'; // Your Live Render URL

Modal.setAppElement('#root');

// --- NEW: Custom Styling and Font Import ---
const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body, button, input, select {
      font-family: 'Inter', sans-serif;
    }
    .rbc-event {
      border-radius: 6px; border: none; box-shadow: 0 2px 5px rgba(0,0,0,0.15);
      padding: 4px 8px; font-weight: 500; transition: all 0.2s; color: white;
    }
    .rbc-event:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); transform: translateY(-1px);
    }
    .rbc-event.rbc-selected { box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
    .rbc-day-slot .rbc-time-slot { border-top: 1px solid #e0e0e0; }
    .rbc-today { background-color: #f0f8ff; }
    .modal-button {
        padding: 10px 18px; border: none; border-radius: 6px; font-weight: 600;
        cursor: pointer; transition: background-color 0.2s, transform 0.1s;
    }
    .modal-button:active { transform: scale(0.98); }
    .modal-button-primary { background-color: #007bff; color: white; }
    .modal-button-primary:hover { background-color: #0056b3; }
    .modal-button-secondary { background-color: #f0f0f0; color: #333; }
    .modal-button-secondary:hover { background-color: #e0e0e0; }
    .modal-button-danger { background-color: #dc3545; color: white; }
    .modal-button-danger:hover { background-color: #c82333; }
  `}</style>
);

const customStyles = {
    content: {
        top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        marginRight: '-50%', transform: 'translate(-50%, -50%)',
        width: '420px', maxHeight: '90vh', overflowY: 'auto',
        borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        padding: '25px 30px', border: 'none'
    },
    overlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)' }
};

function ShiftCalendar({ loggedInUser }) {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const [navDate, setNavDate] = useState(new Date());
    const [view, setView] = useState('week');

    // Form state for a simple shift
    const [shiftDate, setShiftDate] = useState('');
    const [shiftStartTime, setShiftStartTime] = useState('09:00');
    const [shiftEndTime, setShiftEndTime] = useState('17:00');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [editingEvent, setEditingEvent] = useState(null);

    const colorPalette = useMemo(() => ['#E27D60', '#85DCB0', '#E8A87C', '#C38D9E', '#41B3A3', '#6f42c1', '#fd7e14'], []);
    const generateColor = useCallback((userId) => {
        if (!userId) return '#6c757d'; 
        return colorPalette[userId % colorPalette.length];
    }, [colorPalette]);

    const eventStyleGetter = useCallback((event) => {
        const backgroundColor = generateColor(event.userId);
        const style = {
            backgroundColor,
            borderRadius: '6px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block'
        };
        return { style };
    }, [generateColor]);

    const formatEvent = useCallback((shift) => ({
        id: `shift-${shift.id}`,
        title: shift.user ? shift.user.username : 'Unassigned',
        start: new Date(shift.start_time),
        end: new Date(shift.end_time),
        userId: shift.user_id,
    }), []);

    const fetchShifts = useCallback(() => {
        const startDate = moment(navDate).startOf(view).toISOString();
        const endDate = moment(navDate).endOf(view).toISOString();
        axios.get(`${API_URL}/shifts`, { params: { start_date: startDate, end_date: endDate } })
            .then(res => setEvents(res.data.map(formatEvent)))
            .catch(err => console.error('Error fetching shifts', err));
    }, [navDate, view, formatEvent]);
    
    useEffect(() => {
        if(loggedInUser) {
            axios.get(`${API_URL}/users`).then(res => setUsers(res.data));
        }
    }, [loggedInUser]);

    useEffect(() => {
        if (loggedInUser) {
            fetchShifts();
        }
    }, [loggedInUser, fetchShifts]);

    const handleSelectSlot = (slotInfo) => {
        setEditingEvent(null); 
        setShiftDate(moment(slotInfo.start).format('YYYY-MM-DD'));
        setShiftStartTime(moment(slotInfo.start).format('HH:mm'));
        setShiftEndTime(moment(slotInfo.end).format('HH:mm'));
        setSelectedUserId('');
        setModalIsOpen(true);
    };

    const handleSelectEvent = (event) => {
        setEditingEvent(event); 
        setShiftDate(moment(event.start).format('YYYY-MM-DD'));
        setShiftStartTime(moment(event.start).format('HH:mm'));
        setShiftEndTime(moment(event.end).format('HH:mm'));
        setSelectedUserId(event.userId || '');
        setModalIsOpen(true);
    };

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
            .then(() => { fetchShifts(); closeModal(); })
            .catch(err => {
                console.error("Error saving shift", err);
                alert("Could not save shift.");
            });
    };
    
    // --- NEW: Delete handler ---
    const handleDelete = () => {
        if (!editingEvent || !window.confirm(`Are you sure you want to delete the shift for "${editingEvent.title}"?`)) {
            return;
        }

        axios.delete(`${API_URL}/shifts/${editingEvent.id.replace('shift-', '')}`)
            .then(() => {
                fetchShifts();
                closeModal();
            })
            .catch(err => {
                console.error("Error deleting shift", err);
                alert("Could not delete shift.");
            });
    };

    const onEventDrop = ({ event, start, end }) => {
        const payload = {
            start_time: moment.utc(start).toISOString(),
            end_time: moment.utc(end).toISOString(),
            user_id: event.userId,
        };
        axios
            .put(`${API_URL}/shifts/${event.id.replace('shift-', '')}`, payload)
            .then(fetchShifts)
            .catch((err) => {
                console.error('Error updating shift time', err)
                fetchShifts(); 
            });
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setEditingEvent(null);
    };

    return (
        <div>
            <GlobalStyles />
            <div style={{ height: '80vh' }}>
                <DraggableCalendar
                    localizer={localizer}
                    events={events}
                    defaultView="week"
                    style={{ height: "100%" }}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent} 
                    selectable
                    onNavigate={setNavDate}
                    onView={setView}
                    date={navDate}
                    view={view}
                    onEventDrop={onEventDrop}
                    onEventResize={onEventDrop}
                    resizable
                    eventPropGetter={eventStyleGetter}
                />
            </div>

            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} style={customStyles} contentLabel="Shift Modal">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                  <h3 style={{margin: 0, fontSize: '1.4rem', fontWeight: 600}}>{editingEvent ? 'Edit Shift' : 'Add Shift'}</h3>
                  <button onClick={closeModal} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888'}}>&times;</button>
                </div>
                
                <div style={{display: 'flex', flexDirection:'column', gap: '16px', marginBottom: '20px'}}>
                    <div>
                        <label style={{display: 'block', marginBottom: '6px', fontWeight: 500}}>Date</label>
                        <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}/>
                    </div>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <div>
                            <label style={{display: 'block', marginBottom: '6px', fontWeight: 500}}>Start Time</label>
                            <input type="time" value={shiftStartTime} onChange={e => setShiftStartTime(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}/>
                        </div>
                        <div>
                            <label style={{display: 'block', marginBottom: '6px', fontWeight: 500}}>End Time</label>
                            <input type="time" value={shiftEndTime} onChange={e => setShiftEndTime(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}/>
                        </div>
                    </div>
                    <label style={{display: 'block', fontWeight: 500}}>Assign to:</label>
                    <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'white'}}>
                        <option value="">Unassigned</option>
                        {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                    </select>
                </div>

                <div style={{marginTop: '25px', display: 'flex', justifyContent: editingEvent ? 'space-between' : 'flex-end', alignItems: 'center'}}>
                    {editingEvent && (
                        <button onClick={handleDelete} className="modal-button modal-button-danger">Delete</button>
                    )}
                    <div>
                        <button onClick={closeModal} className="modal-button modal-button-secondary" style={{marginRight: '10px'}}>Cancel</button>
                        <button onClick={handleSave} className="modal-button modal-button-primary">{editingEvent ? 'Save Changes' : 'Add Shift'}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default ShiftCalendar;
