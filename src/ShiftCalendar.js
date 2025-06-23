import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment-timezone'; // --- THIS IS THE FIX: Use moment-timezone ---
import 'moment/locale/en-gb'; 
import axios from 'axios';
import Modal from 'react-modal';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

// Import D&D and base calendar CSS
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// FINAL-VERSION-CHECK-CALENDAR-V18
moment.locale('en-gb');
const DraggableCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);
const API_URL = 'https://my-rota-api.onrender.com'; // Your Live Render URL

// ... (Styles and sub-components remain the same) ...
const GlobalStyles = () => ( <style jsx global>{` /* ... styles ... */ `}</style> );
const customStyles = { /* ... styles ... */ };
const TimePicker = ({ value, onChange, label }) => { /* ... component logic ... */ };
const WeeklyHoursSummary = ({ events, users, currentDate }) => { /* ... component logic ... */ };

Modal.setAppElement('#root');

function ShiftCalendar({ loggedInUser }) {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    // ... (other state variables) ...
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [navDate, setNavDate] = useState(new Date());
    const [view, setView] = useState('week');
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

    const formatEvent = useCallback((eventData) => {
        return {
            id: `shift-${eventData.id}`,
            title: eventData.user ? eventData.user.username : 'Unassigned',
            start: new Date(eventData.start_time),
            end: new Date(eventData.end_time),
            userId: eventData.user_id,
            recurring_shift_id: eventData.recurring_shift_id,
            isHoliday: false,
        };
    }, []);
    
    const formatHolidayEvent = useCallback((holiday) => {
        return {
            id: `holiday-${holiday.id}`,
            title: `${holiday.user.username} Holiday (${holiday.status})`,
            start: moment(holiday.start_date).toDate(),
            end: moment(holiday.end_date).add(1, 'days').toDate(),
            allDay: true,
            isHoliday: true,
            status: holiday.status
        };
    }, []);

    const fetchAllEvents = useCallback(() => {
        const startDate = moment(navDate).startOf(view).toISOString();
        const endDate = moment(navDate).endOf(view).toISOString();
        const fetchShifts = axios.get(`${API_URL}/shifts`, { params: { start_date: startDate, end_date: endDate }});
        const fetchHolidays = axios.get(`${API_URL}/holidays`);
        
        Promise.all([fetchShifts, fetchHolidays])
            .then(([shiftsResponse, holidaysResponse]) => {
                const shiftEvents = shiftsResponse.data.map(formatEvent);
                const holidayEvents = holidaysResponse.data.map(formatHolidayEvent);
                setEvents([...shiftEvents, ...holidayEvents]);
            }).catch(err => console.error("Could not fetch events", err));
    }, [navDate, view, formatEvent, formatHolidayEvent]);

    useEffect(() => {
        axios.get(`${API_URL}/users`).then(res => setUsers(res.data));
    }, []);

    useEffect(() => {
        if(loggedInUser) {
            fetchAllEvents();
        }
    }, [loggedInUser, fetchAllEvents]);
    
    // --- THIS IS THE FIX: Create payload with timezone-aware logic ---
    const createPayload = () => ({
        start_time: moment.tz(`${shiftDate}T${shiftStartTime}`, "Europe/London").toISOString(),
        end_time: moment.tz(`${shiftDate}T${shiftEndTime}`, "Europe/London").toISOString(),
        user_id: selectedUserId ? parseInt(selectedUserId) : null,
    });
    
    const handleSave = () => {
        const payload = { ...createPayload(), is_recurring: isRecurring, recurrence_months: recurrenceMonths };
        axios.post(`${API_URL}/shifts`, payload).then(() => { fetchAllEvents(); closeModal(); })
            .catch(err => { console.error("Error saving shift", err); alert("Could not save shift."); });
    };

    const handleUpdate = () => {
        const payload = { ...createPayload(), apply_to_all: updateScope === 'all' };
        const shiftId = String(selectedEvent.id).replace('shift-', '');
        axios.put(`${API_URL}/shifts/${shiftId}`, payload).then(() => { fetchAllEvents(); closeModal(); })
            .catch(err => { console.error("Error updating shift", err); alert("Could not update shift."); });
    };

    const handleSelectSlot = (slotInfo) => {
        // ... (This function remains correct)
    };
    
    // ... (All other handlers are complete and correct)

    return (
        <div>
            {/* ... (The JSX for the component remains the same) ... */}
        </div>
    );
}

export default ShiftCalendar;
