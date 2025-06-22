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

// FINAL-VERSION-CHECK-CALENDAR-V11

moment.locale('en-gb');

const DraggableCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);
const API_URL = 'https://my-rota-api.onrender.com'; // Your Live Render URL

const GlobalStyles = () => ( <style jsx global>{` /* ... styles ... */ `}</style> );
const customStyles = { /* ... styles ... */ };
const TimePicker = ({ value, onChange, label }) => { /* ... component logic ... */ };
const WeeklyHoursSummary = ({ events, users, currentDate }) => { /* ... component logic ... */ };

Modal.setAppElement('#root');

function ShiftCalendar({ loggedInUser }) {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [navDate, setNavDate] = useState(new Date());
    const [view, setView] = useState('week');

    // ... (form state remains the same) ...

    const colorPalette = useMemo(() => ['#3174ad', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6610f2'], []);
    const generateColor = useCallback((id) => !id ? '#6c757d' : colorPalette[id % colorPalette.length], [colorPalette]);
    
    const eventStyleGetter = useCallback((event) => {
        // ... (styling logic remains the same) ...
    }, [generateColor]);

    const formatShiftEvent = useCallback((shift) => ({
        id: `shift-${shift.id}`, title: shift.user ? shift.user.username : 'Unassigned',
        // --- FIX: Use moment to parse the naive string correctly ---
        start: moment(shift.start_time).toDate(),
        end: moment(shift.end_time).toDate(),
        userId: shift.user_id, isHoliday: false, recurring_shift_id: shift.recurring_shift_id
    }), []);
    
    const formatHolidayEvent = useCallback((holiday) => ({
        // ... (holiday formatting logic remains the same) ...
    }), []);

    const fetchAllEvents = useCallback(() => {
        // ... fetch logic remains the same ...
    }, [navDate, view, formatShiftEvent, formatHolidayEvent]);

    useEffect(() => {
        axios.get(`${API_URL}/users`).then(res => setUsers(res.data));
    }, []);

    useEffect(() => {
        if(loggedInUser) fetchAllEvents();
    }, [loggedInUser, fetchAllEvents]);
    
    // --- FIX: Create payload with naive datetime strings ---
    const createPayload = () => ({
        start_time: `${shiftDate}T${shiftStartTime}:00`,
        end_time: `${shiftDate}T${shiftEndTime}:00`,
        user_id: selectedUserId ? parseInt(selectedUserId) : null,
    });

    const handleSave = () => {
        const payload = {
            ...createPayload(),
            is_recurring: isRecurring,
            recurrence_months: recurrenceMonths,
        };
        axios.post(`${API_URL}/shifts`, payload).then(() => { fetchAllEvents(); closeModal(); })
            .catch(err => { console.error("Error saving shift", err); alert("Could not save shift."); });
    };

    // ... (other handlers updated to use new payload logic) ...

    return (
        <div>
            {/* ... (The JSX for the component remains the same) ... */}
        </div>
    );
}

export default ShiftCalendar;
