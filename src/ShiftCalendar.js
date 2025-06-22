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

// FINAL-VERSION-CHECK-CALENDAR-V17
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

    // ... (fetchAllEvents and other useEffects remain the same) ...
    
    // --- FIX: Create payload by converting local time to UTC ISO string ---
    const createPayload = () => ({
        start_time: moment.utc(`${shiftDate}T${shiftStartTime}`).toISOString(),
        end_time: moment.utc(`${shiftDate}T${shiftEndTime}`).toISOString(),
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
