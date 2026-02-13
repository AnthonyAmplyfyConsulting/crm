"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState, useEffect } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isToday
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Clock, User as UserIcon, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Event {
    id: string;
    title: string;
    date: Date;
    time: string;
    type: "Meeting" | "Task" | "Call";
    assignee: string;
}

interface Profile {
    id: string;
    full_name: string;
    role: string;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employees, setEmployees] = useState<Profile[]>([]);

    const supabase = createClient();

    // Modal Form State
    const [eventTitle, setEventTitle] = useState("");
    const [eventTime, setEventTime] = useState("");
    const [eventType, setEventType] = useState<"Meeting" | "Task" | "Call">("Meeting");
    const [assignee, setAssignee] = useState("Me");

    useEffect(() => {
        const fetchEmployees = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, role');

            if (error) {
                console.error('Error fetching employees:', error);
            } else if (data) {
                setEmployees(data);
            }
        };

        fetchEmployees();
    }, []);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setIsModalOpen(true);
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate) return;

        try {
            // Combine date and time
            const [hours, minutes] = eventTime.split(':');
            const eventDateTime = new Date(selectedDate);
            eventDateTime.setHours(parseInt(hours), parseInt(minutes));

            // Find assignee ID if possible, otherwise just store ID if we had it. 
            // The table expects UUID. The dropdown currently gives names. 
            // We need to map the name back to an ID or update the dropdown to valid values.
            // Let's look at how I implemented the dropdown.
            // value={emp.full_name}, but I should use emp.id to get the UUID.

            // Wait, I need to check the dropdown implementation first.
            // It maps emp.full_name to value. I should change that to emp.id.

            let assigneeId = null;
            if (assignee !== 'Me') {
                const selectedEmployee = employees.find(emp => emp.full_name === assignee);
                assigneeId = selectedEmployee?.id;
            } else {
                // If 'Me', we need current user ID. 
                // For now, let's leave assignee null or handle it if we have auth context.
                const { data: { user } } = await supabase.auth.getUser();
                assigneeId = user?.id;
            }

            const { data, error } = await supabase
                .from('events')
                .insert([
                    {
                        title: eventTitle,
                        date: eventDateTime.toISOString(),
                        type: eventType,
                        assignee: assigneeId,
                        // created_by: // Handled by RLS or default? Schema says references profiles(id).
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                // We need to fetch the assignee name to display it in the local state or reload
                // For now, let's just add it to local state to reflect UI change immediately
                const newEvent: Event = {
                    id: data.id,
                    title: data.title,
                    date: new Date(data.date), // Convert back to Date object for local usage
                    time: format(new Date(data.date), 'HH:mm'),
                    type: data.type,
                    assignee: assignee // Keep the display name for local state if possible, or we need to map ID back to name
                };

                setEvents([...events, newEvent]);
                setIsModalOpen(false);
                setEventTitle("");
                setEventTime("");
            }
        } catch (error) {
            console.error('Error adding event:', error);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[900px] h-[500px] bg-blood-orange-500/5 rounded-full blur-[120px]" />
            </div>

            <Navbar />

            <div className="pt-32 px-6 pb-12 max-w-7xl mx-auto relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-heading font-bold text-gradient-orange">
                            Calendar
                        </h1>
                        <p className="text-gray-500 mt-1">Schedule meetings and tasks.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-blood-orange-600 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-lg font-medium w-40 text-center select-none text-gray-900">
                            {format(currentDate, "MMMM yyyy")}
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-blood-orange-600 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="glass-card p-6 bg-white/60 border-white/40">
                    <div className="grid grid-cols-7 mb-4 border-b border-gray-200 pb-4">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
                        {calendarDays.map((day, dayIdx) => {
                            const dayEvents = events.filter(e => isSameDay(e.date, day));
                            const isSelectedMonth = isSameMonth(day, currentDate);
                            const isTodayDate = isToday(day);

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                    min-h-[120px] bg-white p-3 relative group transition-colors cursor-pointer
                    ${!isSelectedMonth ? "bg-gray-50 text-gray-400" : "hover:bg-blood-orange-50/20"}
                  `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`
                      text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                      ${isTodayDate ? "bg-blood-orange-600 text-white" : "text-gray-500"}
                    `}>
                                            {format(day, "d")}
                                        </span>
                                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blood-orange-600 transition-all">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <div className="space-y-1">
                                        {dayEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className={`
                          text-xs px-2 py-1 rounded border truncate
                          ${event.type === 'Meeting' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                        event.type === 'Task' ? 'bg-green-100 text-green-800 border-green-200' :
                                                            'bg-purple-100 text-purple-800 border-purple-200'}
                        `}
                                            >
                                                {event.time} {event.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900 mb-1">Add Event</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </p>

                        <form onSubmit={handleAddEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                    placeholder="Meeting with Client"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="time"
                                            value={eventTime}
                                            onChange={(e) => setEventTime(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={eventType}
                                        onChange={(e) => setEventType(e.target.value as any)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50 appearance-none"
                                    >
                                        <option value="Meeting">Meeting</option>
                                        <option value="Task">Task</option>
                                        <option value="Call">Call</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <select
                                        value={assignee}
                                        onChange={(e) => setAssignee(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blood-orange-500/50 appearance-none"
                                    >
                                        <option value="Me">My Calendar</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blood-orange-600 to-orange-500 hover:from-blood-orange-500 hover:to-orange-400 text-white font-medium py-2 rounded-lg transition-colors shadow-md"
                                >
                                    Create Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
