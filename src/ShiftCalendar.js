import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/en-gb'; 
import axios from 'axios';
import Modal from 'react-modal';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

// Import D&D and base calendar CSS
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// FINAL-VERSION-CHECK-CALENDAR-V3

moment.locale('en-gb');

const DraggableCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);
const API_URL = 'https://my-rota-api.onrender.com'; // Your Live Render URL

const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body, button, input, select { font-family: 'Inter', sans-serif; }
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

// --- RE-ADDED: Weekly Hours Summary Component ---
const WeeklyHoursSummary = ({ events, users, currentDate }) => {
    const weeklyHours = useMemo(() => {
        const startOfWeek = moment(currentDate).startOf('week');
        const endOfWeek = moment(currentDate).endOf('week');
        
        const relevantEvents = events.filter(event => 
            moment(event.start).isBetween(startOfWeek, endOfWeek, undefined, '[]')
        );

        const hoursByUser = {};

        // Initialize all users with 0 hours
        users.forEach(user => {
            hoursByUser[user.id] = { name: user.username, hours: 0 };
        });

        relevantEvents.forEach(event => {
            if (event.userId) {
                const duration = moment.duration(moment(event.end).diff(moment(event.start)));
                const hours = duration.asHours();
                if (hoursByUser[event.userId]) {
                    hoursByUser[event.userId].hours += hours;
                }
            }
        });

        return Object.values(hoursByUser).sort((a,b) => b.hours - a.hours);

    }, [events, users, currentDate]);

    return (
        <div style={{
            marginTop: '20px',
            padding: '20px', 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
        }}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                Weekly Hours Summary ({moment(currentDate).startOf('week').format('MMM D')} - {moment(currentDate).endOf('week').format('MMM D')})
            </h3>
            <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                {weeklyHours.map(user => (
                    user.hours > 0 && <li key={user.name} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 5px', borderBottom: '1px solid #f0f0f0'}}>
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
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [navDate, setNavDate] = useState(new Date());
    const [view, setView] = useState('week');

    // Form state
    const [shiftDate, setShiftDate] = useState('');
    const [shiftStartTime, setShiftStartTime] = useState('09:00');
    const [shiftEndTime, setShiftEndTime] = useState('17:00');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceMonths, setRecurrenceMonths] = useState(3);
    const [updateScope, setUpdateScope] = useState('single');

    const colorPalette = ['#3174ad', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6610f2'];
    const generateColor = (id) => !id ? '#6c757d' : colorPalette[id % colorPalette.length];
    const eventStyleGetter = (event) => ({ style: { backgroundColor: generateColor(event.userId) } });

    const formatEvent = useCallback((shift) => ({
        id: shift.id,
        title: shift.user ? shift.user.username : 'Unassigned',
        start: new Date(shift.start_time),
        end: new Date(shift.end_time),
        userId: shift.user_id,
        recurring_shift_id: shift.recurring_shift_id
    }), []);

    const fetchShifts = useCallback(() => {
        const startDate = moment(navDate).startOf(view === 'month' ? 'month' : 'week').toISOString();
        const endDate = moment(navDate).endOf(view === 'month' ? 'month' : 'week').toISOString();
        axios.get(`${API_URL}/shifts`, { params: { start_date: startDate, end_date: endDate }})
            .then(response => {
                const formattedEvents = response.data.map(shift => formatEvent(shift));
                setEvents(formattedEvents);
            })
            .catch(err => console.error("Could not fetch shifts", err));
    }, [navDate, view, formatEvent]);

    useEffect(() => {
        axios.get(`${API_URL}/users`).then(res => setUsers(res.data));
    }, []);

    useEffect(() => {
        if(loggedInUser) {
            fetchShifts();
        }
    }, [loggedInUser, fetchShifts]);

    
    const handleSelectSlot = (slotInfo) => {
        setSelectedEvent(null);
        setShiftDate(moment(slotInfo.start).format('YYYY-MM-DD'));
        setShiftStartTime(moment(slotInfo.start).format('HH:mm'));
        setShiftEndTime(moment(slotInfo.end).format('HH:mm'));
        setSelectedUserId('');
        setIsRecurring(false);
        setModalIsOpen(true);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setShiftDate(moment(event.start).format('YYYY-MM-DD'));
        setShiftStartTime(moment(event.start).format('HH:mm'));
        setShiftEndTime(moment(event.end).format('HH:mm'));
        setSelectedUserId(event.userId || '');
        setIsRecurring(!!event.recurring_shift_id);
        setUpdateScope('single');
        setModalIsOpen(true);
    };
    
    const handleSave = () => {
        const payload = {
            start_time: new Date(`${shiftDate}T${shiftStartTime}`).toISOString(),
            end_time: new Date(`${shiftDate}T${shiftEndTime}`).toISOString(),
            user_id: selectedUserId ? parseInt(selectedUserId) : null,
            is_recurring: isRecurring,
            recurrence_months: recurrenceMonths,
        };

        axios.post(`${API_URL}/shifts`, payload)
            .then(() => {
                fetchShifts(); 
                closeModal();
            })
            .catch(err => { console.error("Error saving shift", err); alert("Could not save shift."); });
    };

    const handleUpdate = () => {
        const payload = {
            start_time: new Date(`${shiftDate}T${shiftStartTime}`).toISOString(),
            end_time: new Date(`${shiftDate}T${shiftEndTime}`).toISOString(),
            user_id: selectedUserId ? parseInt(selectedUserId) : null,
            apply_to_all: updateScope === 'all',
        };

        axios.put(`${API_URL}/shifts/${selectedEvent.id}`, payload)
            .then(() => {
                fetchShifts();
                closeModal();
            })
            .catch(err => { console.error("Error updating shift", err); alert("Could not update shift."); });
    };

    const handleDelete = () => {
        if (!window.confirm(`Are you sure? This will delete ${updateScope === 'all' ? 'this and all future recurring shifts' : 'only this shift'}.`)) return;

        axios.delete(`${API_URL}/shifts/${selectedEvent.id}`, { data: { apply_to_all: updateScope === 'all' } })
            .then(() => {
                fetchShifts(); 
                closeModal();
            })
            .catch(err => { console.error("Error deleting shift", err); alert("Could not delete shift."); });
    };

    const closeModal = () => { setModalIsOpen(false); setSelectedEvent(null); };
    
    const { minTime, maxTime } = useMemo(() => ({
        minTime: moment().hour(6).minute(0).toDate(),
        maxTime: moment().hour(22).minute(0).toDate(),
    }), []);

    return (
        <div>
            <div style={{ height: '70vh' }}>
                <GlobalStyles />
                <DraggableCalendar
                    localizer={localizer} events={events} style={{ height: '100%' }}
                    selectable={true} onSelectSlot={handleSelectSlot} onSelectEvent={handleSelectEvent}
                    resizable onEventDrop={handleUpdate} onEventResize={handleUpdate}
                    min={minTime} max={maxTime} defaultView="week"
                    eventPropGetter={eventStyleGetter} date={navDate} view={view} onNavigate={setNavDate} onView={setView}
                />
            </div>

            {/* --- RE-ADDED: Conditional rendering for the summary --- */}
            {loggedInUser?.role === 'admin' && (
                <WeeklyHoursSummary events={events} users={users} currentDate={navDate} />
            )}

            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} style={customStyles}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                  <h3 style={{margin: 0, fontSize: '1.4rem', fontWeight: 600}}>{selectedEvent ? 'Edit Shift' : 'Create Shift'}</h3>
                  <button onClick={closeModal} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888'}}>&times;</button>
                </div>
                
                <div style={{display: 'flex', flexDirection:'column', gap: '16px', marginBottom: '20px'}}>
                    <TimePicker label="Start Time" value={shiftStartTime} onChange={setShiftStartTime} />
                    <TimePicker label="End Time" value={shiftEndTime} onChange={setShiftEndTime} />
                    <label style={{display: 'block', fontWeight: 500}}>Assign to:
                        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', marginTop: '6px'}}>
                            <option value="">Unassigned</option>
                            {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                        </select>
                    </label>

                    {!selectedEvent && (
                        <div>
                            <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500}}>
                                <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} style={{width: '18px', height: '18px'}} />
                                Make this a recurring weekly shift
                            </label>
                            {isRecurring && (
                                <div style={{marginTop: '10px', paddingLeft: '26px'}}>
                                    <label style={{display: 'block', marginBottom: '6px', fontWeight: 500}}>Repeat for:</label>
                                    <select value={recurrenceMonths} onChange={e => setRecurrenceMonths(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'white'}}>
                                        <option value={3}>3 Months</option>
                                        <option value={6}>6 Months</option>
                                        <option value={12}>1 Year</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedEvent && selectedEvent.recurring_shift_id && (
                        <div style={{marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '15px'}}>
                            <h4 style={{margin: '0 0 10px 0', fontWeight: 600}}>Edit Options</h4>
                            <label style={{display: 'block', marginBottom: '8px'}}><input type="radio" value="single" checked={updateScope === 'single'} onChange={(e) => setUpdateScope(e.target.value)} /> Apply to this shift only</label>
                            <label style={{display: 'block'}}><input type="radio" value="all" checked={updateScope === 'all'} onChange={(e) => setUpdateScope(e.target.value)} /> Apply to this and all future shifts</label>
                        </div>
                    )}
                </div>

                <div style={{marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    {selectedEvent ? (
                        <>
                            <button onClick={handleDelete} className="modal-button modal-button-danger">Delete</button>
                            <button onClick={handleUpdate} className="modal-button modal-button-primary">Save Changes</button>
                        </>
                    ) : (
                        <button onClick={handleSave} className="modal-button modal-button-primary" style={{width: '100%'}}>Save Shift</button>
                    )}
                </div>
            </Modal>
        </div>
    );
}

export default ShiftCalendar;
