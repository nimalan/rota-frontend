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

moment.locale('en-gb');

const DraggableCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);
const API_URL = 'https://my-rota-api.onrender.com'; // Your Live Render URL

// ... (GlobalStyles, customStyles, TimePicker, WeeklyHoursSummary components remain the same) ...

Modal.setAppElement('#root');

function ShiftCalendar({ loggedInUser }) {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [navDate, setNavDate] = useState(new Date());
    const [view, setView] = useState('week');

    // Form state
    const [shiftDate, setShiftDate] = useState(moment().format('YYYY-MM-DD'));
    const [shiftStartTime, setShiftStartTime] = useState('09:00');
    const [shiftEndTime, setShiftEndTime] = useState('17:00');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceWeeks, setRecurrenceWeeks] = useState(4);
    const [updateScope, setUpdateScope] = useState('single');

    const colorPalette = useMemo(() => ['#3174ad', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#6610f2'], []);
    
    const generateColor = useCallback((id) => !id ? '#6c757d' : colorPalette[id % colorPalette.length], [colorPalette]);
    
    const eventStyleGetter = useCallback((event) => {
        let style = { 
            borderRadius: '6px', 
            opacity: 0.9, 
            color: 'white', 
            border: '0px', 
            display: 'block' 
        };
        if (event.isHoliday) {
            style.backgroundColor = event.status === 'approved' ? '#28a745' : '#ffc107';
            style.color = event.status === 'pending' ? '#212529' : 'white';
        } else {
            style.backgroundColor = generateColor(event.userId);
        }
        return { style };
    }, [generateColor]);

    // Fixed date formatting function
    const formatShiftEvent = useCallback((shift) => {
        // Ensure UTC format for consistent parsing
        const start = shift.start_time.endsWith('Z') ? shift.start_time : `${shift.start_time}Z`;
        const end = shift.end_time.endsWith('Z') ? shift.end_time : `${shift.end_time}Z`;
        
        return {
            id: `shift-${shift.id}`, 
            title: shift.user ? shift.user.username : 'Unassigned',
            start: new Date(start), 
            end: new Date(end),
            userId: shift.user_id, 
            isHoliday: false, 
            recurring_shift_id: shift.recurring_shift_id
        };
    }, []);

    const formatHolidayEvent = useCallback((holiday) => ({
        id: `holiday-${holiday.id}`, 
        title: `${holiday.user.username} Holiday (${holiday.status})`,
        start: moment(holiday.start_date).startOf('day').toDate(), 
        end: moment(holiday.end_date).endOf('day').toDate(),
        allDay: true, 
        isHoliday: true, 
        status: holiday.status
    }), []);

    const fetchAllEvents = useCallback(() => {
        if (!loggedInUser) return;
        
        const startDate = moment(navDate).startOf(view).toISOString();
        const endDate = moment(navDate).endOf(view).toISOString();
        
        Promise.all([
            axios.get(`${API_URL}/shifts`, { 
                params: { 
                    start_date: startDate, 
                    end_date: endDate 
                }
            }),
            axios.get(`${API_URL}/holidays`)
        ])
        .then(([shiftsResponse, holidaysResponse]) => {
            const shiftEvents = shiftsResponse.data.map(formatShiftEvent);
            const holidayEvents = holidaysResponse.data.map(formatHolidayEvent);
            setEvents([...shiftEvents, ...holidayEvents]);
        })
        .catch(err => {
            console.error("Error fetching events:", err);
            alert("Failed to load events");
        });
    }, [navDate, view, formatShiftEvent, formatHolidayEvent, loggedInUser]);

    useEffect(() => {
        axios.get(`${API_URL}/users`)
            .then(res => setUsers(res.data))
            .catch(err => console.error("Error fetching users:", err));
    }, []);

    useEffect(() => {
        fetchAllEvents();
    }, [fetchAllEvents]);

    const resetForm = () => {
        setShiftDate(moment().format('YYYY-MM-DD'));
        setShiftStartTime('09:00');
        setShiftEndTime('17:00');
        setSelectedUserId('');
        setIsRecurring(false);
        setRecurrenceWeeks(4);
    };

    const handleSelectSlot = (slotInfo) => {
        resetForm();
        setSelectedEvent(null);
        setShiftDate(moment(slotInfo.start).format('YYYY-MM-DD'));
        setShiftStartTime(moment(slotInfo.start).format('HH:mm'));
        setShiftEndTime(moment(slotInfo.end).format('HH:mm'));
        setModalIsOpen(true);
    };

    const handleSelectEvent = (event) => {
        if (event.isHoliday) return;
        
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
        const startDateTime = moment(`${shiftDate}T${shiftStartTime}`).toISOString();
        const endDateTime = moment(`${shiftDate}T${shiftEndTime}`).toISOString();

        const payload = {
            start_time: startDateTime,
            end_time: endDateTime,
            user_id: selectedUserId ? parseInt(selectedUserId) : null,
            is_recurring: isRecurring,
            recurrence_interval: 'weekly',
            recurrence_count: recurrenceWeeks
        };

        axios.post(`${API_URL}/shifts`, payload)
            .then(() => {
                fetchAllEvents();
                closeModal();
            })
            .catch(err => {
                console.error("Error saving shift:", err.response?.data || err.message);
                alert("Could not save shift. Please check the times and try again.");
            });
    };

    const handleUpdate = () => {
        if (!selectedEvent) return;
        
        const startDateTime = moment(`${shiftDate}T${shiftStartTime}`).toISOString();
        const endDateTime = moment(`${shiftDate}T${shiftEndTime}`).toISOString();

        const payload = {
            start_time: startDateTime,
            end_time: endDateTime,
            user_id: selectedUserId ? parseInt(selectedUserId) : null,
            apply_to_all: updateScope === 'all'
        };

        const shiftId = selectedEvent.id.replace('shift-', '');

        axios.put(`${API_URL}/shifts/${shiftId}`, payload)
            .then(() => {
                fetchAllEvents();
                closeModal();
            })
            .catch(err => {
                console.error("Error updating shift:", err.response?.data || err.message);
                alert("Could not update shift. Please check the times and try again.");
            });
    };
    
    const handleDelete = () => {
        if (!selectedEvent) return;
        
        if (!window.confirm(
            `Are you sure? This will delete ${updateScope === 'all' ? 
            'this and all future recurring shifts' : 'only this shift'}.`
        )) return;

        const shiftId = selectedEvent.id.replace('shift-', '');

        axios.delete(`${API_URL}/shifts/${shiftId}`, { 
            data: { apply_to_all: updateScope === 'all' } 
        })
        .then(() => {
            fetchAllEvents();
            closeModal();
        })
        .catch(err => {
            console.error("Error deleting shift:", err.response?.data || err.message);
            alert("Could not delete shift.");
        });
    };

    const handleEventDrop = ({ event, start, end }) => {
        if (event.isHoliday) return;

        const payload = {
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            user_id: event.userId,
            apply_to_all: false
        };

        const shiftId = event.id.replace('shift-', '');

        axios.put(`${API_URL}/shifts/${shiftId}`, payload)
            .then(fetchAllEvents)
            .catch(err => {
                console.error("Error updating shift via drag:", err);
                alert("Could not update shift position.");
                fetchAllEvents(); // Refresh to revert visual change
            });
    };
    
    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedEvent(null);
        resetForm();
    };

    const { minTime, maxTime } = useMemo(() => ({
        minTime: moment().hour(6).minute(0).toDate(),
        maxTime: moment().hour(22).minute(0).toDate(),
    }), []);

    return (
        <div>
            <div style={{ height: '70vh' }}>
                <GlobalStyles />
                <DraggableCalendar
                    localizer={localizer}
                    events={events}
                    style={{ height: '100%' }}
                    selectable={true}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    resizable
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventDrop}
                    min={minTime}
                    max={maxTime}
                    defaultView="week"
                    eventPropGetter={eventStyleGetter}
                    date={navDate}
                    view={view}
                    onNavigate={setNavDate}
                    onView={setView}
                />
            </div>

            {loggedInUser?.role === 'admin' && (
                <WeeklyHoursSummary 
                    events={events} 
                    users={users} 
                    currentDate={navDate} 
                />
            )}

            <Modal 
                isOpen={modalIsOpen} 
                onRequestClose={closeModal} 
                style={customStyles}
                contentLabel={selectedEvent ? "Edit Shift" : "Create Shift"}
            >
                <h2 style={{ marginTop: 0 }}>
                    {selectedEvent ? "Edit Shift" : "Create New Shift"}
                </h2>
                
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                        Date
                    </label>
                    <input
                        type="date"
                        value={shiftDate}
                        onChange={(e) => setShiftDate(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <TimePicker 
                        value={shiftStartTime} 
                        onChange={setShiftStartTime} 
                        label="Start Time" 
                    />
                    <TimePicker 
                        value={shiftEndTime} 
                        onChange={setShiftEndTime} 
                        label="End Time" 
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                        Assign to
                    </label>
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    >
                        <option value="">Unassigned</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.username}
                            </option>
                        ))}
                    </select>
                </div>

                {!selectedEvent && (
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                            />
                            Create as recurring shift
                        </label>
                        
                        {isRecurring && (
                            <div style={{ marginTop: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                                    Repeat for how many weeks?
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="52"
                                    value={recurrenceWeeks}
                                    onChange={(e) => setRecurrenceWeeks(Math.max(1, Math.min(52, parseInt(e.target.value) || 1))}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {selectedEvent?.recurring_shift_id && (
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                            Apply changes to:
                        </label>
                        <select
                            value={updateScope}
                            onChange={(e) => setUpdateScope(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                        >
                            <option value="single">Only this shift</option>
                            <option value="all">This and all future shifts in series</option>
                        </select>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    {selectedEvent && (
                        <button 
                            onClick={handleDelete}
                            className="modal-button modal-button-danger"
                        >
                            Delete
                        </button>
                    )}
                    <button 
                        onClick={closeModal}
                        className="modal-button modal-button-secondary"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={selectedEvent ? handleUpdate : handleSave}
                        className="modal-button modal-button-primary"
                    >
                        {selectedEvent ? "Update" : "Create"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default ShiftCalendar;