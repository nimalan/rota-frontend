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

// FINAL-VERSION-CHECK-CALENDAR-V10

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

    // --- THIS IS THE FRONTEND FIX ---
    const formatShiftEvent = useCallback((shift) => ({
        id: `shift-${shift.id}`, title: shift.user ? shift.user.username : 'Unassigned',
        // The backend now guarantees a full ISO string. The JS Date constructor will handle it correctly.
        start: new Date(shift.start_time),
        end: new Date(shift.end_time),
        userId: shift.user_id, isHoliday: false, recurring_shift_id: shift.recurring_shift_id
    }), []);
    
    const formatHolidayEvent = useCallback((holiday) => ({
        id: `holiday-${holiday.id}`, title: `${holiday.user.username} Holiday (${holiday.status})`,
        start: moment(holiday.start_date).toDate(), end: moment(holiday.end_date).add(1, 'days').toDate(),
        allDay: true, isHoliday: true, status: holiday.status
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
    
    // ... (all handler functions remain the same) ...

    return (
        <div>
            {/* ... (The JSX for the component remains the same) ... */}
        </div>
    );
}

export default ShiftCalendar;
