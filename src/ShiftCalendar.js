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

// FINAL-VERSION-CHECK-CALENDAR-V14
moment.locale('en-gb');
const DraggableCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);
const API_URL = 'https://my-rota-api.onrender.com'; // Your Live Render URL

// ... (Styles and sub-components remain the same) ...

Modal.setAppElement('#root');

function ShiftCalendar({ loggedInUser }) {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    // ... (other state variables) ...

    const formatEvent = useCallback((eventData) => {
        // --- FIX: This now correctly parses the guaranteed UTC string from the backend ---
        return {
            id: `shift-${eventData.id}`,
            title: eventData.user ? eventData.user.username : 'Unassigned',
            start: new Date(eventData.start_time), // e.g., new Date("2025-06-22T17:00:00Z")
            end: new Date(eventData.end_time),
            userId: eventData.user_id,
            recurring_shift_id: eventData.recurring_shift_id,
            isHoliday: false
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
    
    // ... (fetchAllEvents and other useEffects remain the same) ...
    
    const createPayload = () => ({
        // --- FIX: Send full UTC ISO string to backend ---
        start_time: moment.utc(`${shiftDate}T${shiftStartTime}`).toISOString(),
        end_time: moment.utc(`${shiftDate}T${shiftEndTime}`).toISOString(),
        user_id: selectedUserId ? parseInt(selectedUserId) : null,
    });
    
    // ... (all handler functions remain the same) ...

    return (
        <div>
            {/* ... (The JSX for the component remains the same) ... */}
        </div>
    );
}

export default ShiftCalendar;
