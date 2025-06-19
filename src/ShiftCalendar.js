import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/en-gb'; 
import axios from 'axios';
import Modal from 'react-modal';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

// Import D&D and base calendar CSS
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('en-gb');

const DraggableCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);
const API_URL = 'https://my-rota-api.onrender.com'; // Replace with your actual Render URL

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
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
    }
};

const TimePicker = ({ value, onChange, label }) => {
    const [hour, minute] = value.split(':');
    const handleHourChange = (e) => onChange(`${e.target.value}:${minute}`);
    const handleMinuteChange = (e) => onChange(`${hour}:${e.target.value}`);
    const hours = Array.from({ length: (22 - 6) + 1 }, (_, i) => 6 + i);

    return (
        <div style={{flex: 1}}>
            <label style={{display: 'block', marginBottom: '6px', fontWeight: 500}}>{label}</label>
            <div style={{display: 'flex', gap: '8px'}}>
                <select value={hour} onChange={handleHourChange} style={{flex: 1, width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'white'}}>
                    {hours.map(h => <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</option>)}
                </select>
                <select value={minute} onChange={handleMinuteChange} style={{flex: 1, width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'white'}}>
                    <option value="00">00</option>
                    <option value="30">30</option>
                </select>
            </div>
        </div>
    );
};


const WeeklyHoursSummary = ({ events, users, currentDate }) => {
    const weeklyHours = useMemo(() => {
        const startOfWeek = moment(currentDate).startOf('week');
        const endOfWeek = moment(currentDate).endOf('week');
        const relevantEvents = events.filter(event => moment(event.start).isBetween(startOfWeek, endOfWeek, undefined, '[]'));
        const hoursByUser = {};
        users.forEach(user => { hoursByUser[user.id] = { name: user.username, hours: 0 }; });
        relevantEvents.forEach(event => {
            if (event.userId && hoursByUser[event.userId]) {
                hoursByUser[event.userId].hours += moment.duration(moment(event.end).diff(moment(event.start))).asHours();
            }
        });
        return Object.values(hoursByUser).sort((a,b) => b.hours - a.hours);
    }, [events, users, currentDate]);

    return (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                Weekly Hours Summary ({moment(currentDate).startOf('week').format('MMM D')} - {moment(currentDate).endOf('week').format('MMM D')})
            </h3>
            <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                {weeklyHours.map(user => (
                    <li key={user.name} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 5px', borderBottom: '1px solid #f0f0f0'}}>
                        <span style={{fontWeight: 500}}>{user.name}</span>
                        <span style={{fontWeight: 600, color: '#007bff'}}>{user.hours.toFixed(2)} hours</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

Modal.setAppElement('#root');

function ShiftCalendar({ loggedInUser }) {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [error, setError] = useState('');
    const [shiftDate, setShiftDate] = useState('');
    const [shiftStartTime, setShiftStartTime] = useState('09:00');
    const [shiftEndTime, setShiftEndTime] = useState('17:00');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [navDate, setNavDate] = useState(new Date());
    const [view, setView] = useState('week');

    const colorPalette = ['#3174ad', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6610f2'];
    const generateColor = (id) => !id ? '#6c757d' : colorPalette[id % colorPalette.length];
    const eventStyleGetter = (event) => ({ style: { backgroundColor: generateColor(event.userId) } });

    useEffect(() => {
        const fetchShifts = axios.get(`${API_URL}/shifts?start_date=${moment(navDate).startOf('month').toISOString()}&end_date=${moment(navDate).endOf('month').toISOString()}`);
        const fetchUsers = axios.get(`${API_URL}/users`);
        Promise.all([fetchShifts, fetchUsers]).then(([shiftsResponse, usersResponse]) => {
            const formattedEvents = shiftsResponse.data.map(shift => formatEvent(shift));
            setEvents(formattedEvents);
            setUsers(usersResponse.data);
        }).catch(err => { console.error('Error fetching data!', err); setError('Could not fetch initial data.'); });
    }, [navDate]);
    
    const handleMoveOrResize = ({ event, start, end }) => {
        const originalEvents = [...events];
        const updatedEvents = events.map(e => e.id === event.id ? { ...e, start, end } : e);
        setEvents(updatedEvents);
        axios.put(`${API_URL}/shifts/${event.id}`, { start_time: start.toISOString(), end_time: end.toISOString() })
            .catch(err => { console.error('Error updating shift!', err); alert('Could not update shift. Reverting.'); setEvents(originalEvents); });
    };

    const handleSelectSlot = (slotInfo) => {
        setSelectedEvent(null);
        const mStart = moment(slotInfo.start);
        const mEnd = moment(slotInfo.end);
        let startHour = mStart.hour();
        let startMinute = mStart.minute() < 30 ? '00' : '30';
        if (startHour < 6) { startHour = 6; startMinute = '00'; }
        
        let endHour = mEnd.hour();
        let endMinute = mEnd.minute() < 30 ? '00' : '30';
        if (!mStart.isSame(mEnd, 'day') || endHour > 22 || (endHour === 22 && endMinute !== '00')) {
            endHour = 22; endMinute = '00';
        }

        setShiftDate(mStart.format('YYYY-MM-DD'));
        setShiftStartTime(`${String(startHour).padStart(2, '0')}:${startMinute}`);
        setShiftEndTime(`${String(endHour).padStart(2, '0')}:${endMinute}`);
        setSelectedUserId('');
        setModalIsOpen(true);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        const mStart = moment(event.start);
        const mEnd = moment(event.end);
        setShiftDate(mStart.format('YYYY-MM-DD'));
        setShiftStartTime(mStart.format('HH:mm'));
        setShiftEndTime(mEnd.format('HH:mm'));
        setSelectedUserId(event.userId || '');
        setModalIsOpen(true);
    };
    
    const handleSaveShift = () => {
        if (!validateTimes()) return;
        axios.post(`${API_URL}/shifts`, createPayload()).then(res => {
            setEvents(prev => [...prev, formatEvent(res.data)]);
            closeModal();
        }).catch(err => { console.error('Error saving shift!', err); alert('Could not save shift.'); });
    };
    
    const handleUpdateShift = () => {
        if (!selectedEvent || !validateTimes()) return;
        axios.put(`${API_URL}/shifts/${selectedEvent.id}`, createPayload()).then(res => {
            setEvents(prev => prev.map(e => e.id === res.data.id ? formatEvent(res.data) : e));
            closeModal();
        }).catch(err => { console.error('Error updating shift!', err); alert('Could not update shift.'); });
    };
    
    const handleDeleteShift = () => {
        if (!selectedEvent || !window.confirm(`Delete shift for "${selectedEvent.title}"?`)) return;
        axios.delete(`${API_URL}/shifts/${selectedEvent.id}`).then(() => {
            setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
            closeModal();
        }).catch(err => { console.error('Error deleting shift!', err); alert('Could not delete shift.'); });
    };
    
    const validateTimes = () => {
        if (new Date(`${shiftDate}T${shiftEndTime}`) <= new Date(`${shiftDate}T${shiftStartTime}`)) {
            alert("End time must be after start time."); return false;
        } return true;
    };
    
    const createPayload = () => ({
        start_time: new Date(`${shiftDate}T${shiftStartTime}`).toISOString(),
        end_time: new Date(`${shiftDate}T${shiftEndTime}`).toISOString(),
        user_id: selectedUserId ? parseInt(selectedUserId) : null,
    });

    const formatEvent = (shift) => ({
        id: shift.id, title: shift.user ? shift.user.username : 'Unassigned',
        start: new Date(shift.start_time + 'Z'), end: new Date(shift.end_time + 'Z'),
        userId: shift.user_id,
    });
    
    const closeModal = () => { setModalIsOpen(false); setSelectedEvent(null); };
    
    const { minTime, maxTime } = useMemo(() => ({
        minTime: moment().hour(6).minute(0).toDate(),
        maxTime: moment().hour(22).minute(0).toDate(),
    }), []);

    return (
        <div>
            <div style={{ height: '70vh' }}>
                <GlobalStyles />
                {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
                <DraggableCalendar
                    localizer={localizer}
                    events={events}
                    style={{ height: '100%' }}
                    selectable={true}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    onEventDrop={handleMoveOrResize}
                    onEventResize={handleMoveOrResize}
                    resizable
                    min={minTime}
                    max={maxTime}
                    eventPropGetter={eventStyleGetter}
                    date={navDate}
                    view={view}
                    onNavigate={setNavDate}
                    onView={setView}
                />
            </div>
            
            {loggedInUser?.role === 'admin' && (
                <WeeklyHoursSummary events={events} users={users} currentDate={navDate} />
            )}

            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} style={customStyles}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                  <h3 style={{margin: 0, fontSize: '1.4rem', fontWeight: 600}}>{selectedEvent ? 'Edit Shift' : 'Create Shift'}</h3>
                  <button onClick={closeModal} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888'}}>&times;</button>
                </div>
                <div style={{display: 'flex', flexDirection:'column', gap: '16px', marginBottom: '20px'}}>
                    <div>
                        <label style={{display: 'block', marginBottom: '6px', fontWeight: 500}}>Date</label>
                        <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}/>
                    </div>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <TimePicker label="Start Time" value={shiftStartTime} onChange={setShiftStartTime} />
                        <TimePicker label="End Time" value={shiftEndTime} onChange={setShiftEndTime} />
                    </div>
                </div>
                <label style={{display: 'block', marginBottom: '6px', fontWeight: 500}}>Assign to:</label>
                <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'white'}}>
                    <option value="">Unassigned</option>
                    {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                </select>
                <div style={{marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    {selectedEvent ? (
                        <>
                            <button onClick={handleDeleteShift} className="modal-button modal-button-danger">Delete Shift</button>
                            <div>
                                <button onClick={closeModal} className="modal-button modal-button-secondary" style={{marginRight: '10px'}}>Cancel</button>
                                <button onClick={handleUpdateShift} className="modal-button modal-button-primary">Save Changes</button>
                            </div>
                        </>
                    ) : (
                        <div style={{width: '100%', display: 'flex', justifyContent: 'flex-end'}}>
                           <button onClick={closeModal} className="modal-button modal-button-secondary" style={{marginRight: '10px'}}>Cancel</button>
                           <button onClick={handleSaveShift} className="modal-button modal-button-primary">Save Shift</button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

export default ShiftCalendar;
