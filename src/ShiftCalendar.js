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

// FINAL-VERSION-CHECK-CALENDAR-V27
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

    const [navDate, setNavDate] = useState(new Date());
    const [view, setView] = useState('week');

    // Form state for a simple shift
    const [shiftDate, setShiftDate] = useState('');
    const [shiftStartTime, setShiftStartTime] = useState('09:00');
    const [shiftEndTime, setShiftEndTime] = useState('17:00');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [editingEvent, setEditingEvent] = useState(null);

    // --- NEW: Color coding logic ---
    const colorPalette = useMemo(() => ['#E27D60', '#85DCB0', '#E8A87C', '#C38D9E', '#41B3A3', '#6f42c1', '#fd7e14'], []);
    const generateColor = useCallback((userId) => {
        if (!userId) return '#6c757d'; // Default grey for unassigned
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
            .then(res => {
                const formatted = res.data.map(formatEvent);
                setEvents(formatted);
            })
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
            .then(() => {
                fetchShifts(); 
                closeModal();
            })
            .catch(err => {
                console.error("Error saving shift", err);
                alert("Could not save shift.");
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
                    // --- NEW: Applying the color styles ---
                    eventPropGetter={eventStyleGetter}
                />
            </div>

            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} style={customStyles} contentLabel="Shift Modal">
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
