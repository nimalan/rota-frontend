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

// FINAL-VERSION-CHECK-CALENDAR-V9

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
    const [hour, minute] = value ? value.split(':') : ['09', '00'];
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
        
        const relevantEvents = events.filter(event => 
            !event.isHoliday && moment(event.start).isBetween(startOfWeek, endOfWeek, undefined, '[]')
        );

        const hoursByUser = {};
        users.forEach(user => {
            hoursByUser[user.id] = { name: user.username, hours: 0 };
        });

        relevantEvents.forEach(event => {
            if (event.userId && hoursByUser[event.userId]) {
                const duration = moment.duration(moment(event.end).diff(moment(event.start)));
                hoursByUser[event.userId].hours += duration.asHours();
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
                {weeklyHours.filter(u => u.hours > 0).map(user => (
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

    const colorPalette = useMemo(() => ['#3174ad', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6610f2'], []);
    const generateColor = useCallback((id) => !id ? '#6c757d' : colorPalette[id % colorPalette.length], [colorPalette]);
    
    const eventStyleGetter = useCallback((event) => {
        let style = { borderRadius: '6px', opacity: 0.9, color: 'white', border: '0px', display: 'block' };
        if (event.isHoliday) {
            style.backgroundColor = event.status === 'approved' ? '#28a745' : '#ffc107';
            style.color = event.status === 'pending' ? '#212529' : 'white';
        } else {
            style.backgroundColor = generateColor(event.userId);
        }
        return { style };
    }, [generateColor]);

    // --- THIS IS THE FIX ---
    // This function now defensively ensures that any date string from the backend
    // is treated as UTC before being converted to a local Date object.
    const formatShiftEvent = useCallback((shift) => {
        const startUTC = shift.start_time.endsWith('Z') ? shift.start_time : `${shift.start_time}Z`;
        const endUTC = shift.end_time.endsWith('Z') ? shift.end_time : `${shift.end_time}Z`;

        return {
            id: `shift-${shift.id}`, title: shift.user ? shift.user.username : 'Unassigned',
            start: new Date(startUTC), end: new Date(endUTC),
            userId: shift.user_id, isHoliday: false, recurring_shift_id: shift.recurring_shift_id
        }
    }, []);
    
    const formatHolidayEvent = useCallback((holiday) => ({
        id: `holiday-${holiday.id}`, title: `${holiday.user.username} Holiday (${holiday.status})`,
        start: moment(holiday.start_date).toDate(), end: moment(holiday.end_date).add(1, 'days').toDate(),
        allDay: true, isHoliday: true, status: holiday.status
    }), []);

    const fetchAllEvents = useCallback(() => {
        const startDate = moment(navDate).startOf(view).toISOString();
        const endDate = moment(navDate).endOf(view).toISOString();
        const fetchShifts = axios.get(`${API_URL}/shifts`, { params: { start_date: startDate, end_date: endDate }});
        const fetchHolidays = axios.get(`${API_URL}/holidays`);
        
        Promise.all([fetchShifts, fetchHolidays])
            .then(([shiftsResponse, holidaysResponse]) => {
                const shiftEvents = shiftsResponse.data.map(formatShiftEvent);
                const holidayEvents = holidaysResponse.data.map(formatHolidayEvent);
                setEvents([...shiftEvents, ...holidayEvents]);
            }).catch(err => console.error("Could not fetch events", err));
    }, [navDate, view, formatShiftEvent, formatHolidayEvent]);

    useEffect(() => {
        axios.get(`${API_URL}/users`).then(res => setUsers(res.data));
    }, []);

    useEffect(() => {
        if(loggedInUser) {
            fetchAllEvents();
        }
    }, [loggedInUser, fetchAllEvents]);
    
    const handleSelectSlot = (slotInfo) => {
        setSelectedEvent(null);
        setShiftDate(moment(slotInfo.start).format('YYYY-MM-DD'));
        setShiftStartTime(moment(slotInfo.start).format('HH:mm'));
        setShiftEndTime(moment(slotInfo.end).format('HH:mm'));
        setSelectedUserId(''); setIsRecurring(false); setModalIsOpen(true);
    };

    const handleSelectEvent = (event) => {
        if (event.isHoliday) return;
        setSelectedEvent(event);
        setShiftDate(moment(event.start).format('YYYY-MM-DD'));
        setShiftStartTime(moment(event.start).format('HH:mm'));
        setShiftEndTime(moment(event.end).format('HH:mm'));
        setSelectedUserId(event.userId || '');
        setIsRecurring(!!event.recurring_shift_id);
        setUpdateScope('single'); setModalIsOpen(true);
    };
    
    const handleSave = () => {
        const payload = {
            start_time: new Date(`${shiftDate}T${shiftStartTime}`).toISOString(),
            end_time: new Date(`${shiftDate}T${shiftEndTime}`).toISOString(),
            user_id: selectedUserId ? parseInt(selectedUserId) : null,
            is_recurring: isRecurring,
            recurrence_months: recurrenceMonths,
        };
        axios.post(`${API_URL}/shifts`, payload).then(() => { fetchAllEvents(); closeModal(); })
            .catch(err => { console.error("Error saving shift", err); alert("Could not save shift."); });
    };

    const handleUpdate = () => {
        const payload = {
            start_time: new Date(`${shiftDate}T${shiftStartTime}`).toISOString(),
            end_time: new Date(`${shiftDate}T${shiftEndTime}`).toISOString(),
            user_id: selectedUserId ? parseInt(selectedUserId) : null,
            apply_to_all: updateScope === 'all',
        };
        const shiftId = String(selectedEvent.id).replace('shift-', '');
        axios.put(`${API_URL}/shifts/${shiftId}`, payload).then(() => { fetchAllEvents(); closeModal(); })
            .catch(err => { console.error("Error updating shift", err); alert("Could not update shift."); });
    };
    
    const handleDelete = () => {
        if (!window.confirm(`Are you sure? This will delete ${updateScope === 'all' ? 'this and all future recurring shifts' : 'only this shift'}.`)) return;
        const shiftId = String(selectedEvent.id).replace('shift-', '');
        axios.delete(`${API_URL}/shifts/${shiftId}`, { data: { apply_to_all: updateScope === 'all' } }).then(() => { fetchAllEvents(); closeModal(); })
            .catch(err => { console.error("Error deleting shift", err); alert("Could not delete shift."); });
    };

    const handleEventDrop = ({ event, start, end }) => {
        if (event.isHoliday) return;
        const payload = {
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            user_id: event.userId,
            apply_to_all: false, 
        };
        const shiftId = String(event.id).replace('shift-', '');
        axios.put(`${API_URL}/shifts/${shiftId}`, payload).then(() => fetchAllEvents())
            .catch(err => {
                console.error("Error updating shift via drag", err);
                alert("Could not update shift.");
                fetchAllEvents();
            });
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
                    resizable onEventDrop={handleEventDrop} onEventResize={handleEventDrop}
                    min={minTime} max={maxTime} defaultView="week"
                    eventPropGetter={eventStyleGetter} date={navDate} view={view} onNavigate={setNavDate} onView={setView}
                />
            </div>
            {loggedInUser?.role === 'admin' && <WeeklyHoursSummary events={events} users={users} currentDate={navDate} />}
            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} style={customStyles}>
                {/* ... (Modal JSX is complete and correct) ... */}
            </Modal>
        </div>
    );
}

export default ShiftCalendar;
