import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment-timezone'; // Using moment-timezone for robust handling
import 'moment/locale/en-gb'; 
import axios from 'axios';
import Modal from 'react-modal';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

// Import D&D and base calendar CSS
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// FINAL-VERSION-CHECK-CALENDAR-V24
moment.locale('en-gb');
const DraggableCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);
const API_URL = 'https://my-rota-api.onrender.com'; // Your Live Render URL

// ... (Styles and sub-components are all correct) ...

Modal.setAppElement('#root');

function ShiftCalendar({ loggedInUser }) {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
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

    // ... (eventStyleGetter and formatters are correct) ...

    const fetchAllEvents = useCallback(() => {
        // ... fetch logic ...
    }, [navDate, view]);

    useEffect(() => {
        // ... user fetch logic ...
    }, []);

    useEffect(() => {
        if(loggedInUser) fetchAllEvents();
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
        // Note: isRecurring is determined by the existence of recurring_shift_id
        setUpdateScope('single'); setModalIsOpen(true);
    };
    
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
    
    const handleDelete = () => {
        if (!window.confirm(`Are you sure? This will delete ${updateScope === 'all' ? 'this and all future recurring shifts' : 'only this shift'}.`)) return;
        const shiftId = String(selectedEvent.id).replace('shift-', '');
        axios.delete(`${API_URL}/shifts/${shiftId}`, { data: { apply_to_all: updateScope === 'all' } }).then(() => { fetchAllEvents(); closeModal(); })
            .catch(err => { console.error("Error deleting shift", err); alert("Could not delete shift."); });
    };

    // ... (other handlers and hooks) ...
    
    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedEvent(null);
    };
    
    return (
        <div>
            {/* ... (Calendar and Weekly Summary JSX) ... */}

            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} style={customStyles}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                  <h3 style={{margin: 0, fontSize: '1.4rem', fontWeight: 600}}>{selectedEvent ? 'Edit Shift' : 'Create Shift'}</h3>
                  <button onClick={closeModal} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888'}}>&times;</button>
                </div>
                <div style={{display: 'flex', flexDirection:'column', gap: '16px', marginBottom: '20px'}}>
                    {/* ... (Date, Time, User select fields) ... */}

                    {/* Recurrence Options for Creating Shifts */}
                    {!selectedEvent && (
                        <div>
                            <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500}}>
                                <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} style={{width: '18px', height: '18px'}} />
                                Make this a recurring weekly shift
                            </label>
                            {isRecurring && (
                                <div style={{marginTop: '10px', paddingLeft: '26px'}}>
                                    {/* ... recurrence months dropdown ... */}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- NEW: Edit Scope Options for Recurring Shifts --- */}
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
