import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, MessageSquare, Bell, Info, AlertTriangle, Calendar } from 'lucide-react';

interface TicketNotification {
    id: string;
    ticketNumber: string;
    subject: string;
    category: string;
    priority: string;
    employee: {
        firstName: string;
        lastName: string;
    };
}

interface LeaveNotification {
    _id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    employee: {
        firstName: string;
        lastName: string;
    };
}

interface ChatMessageNotification {
    chatId: string;
    message: {
        _id: string;
        sender: {
            _id: string;
            email: string;
        };
        content: string;
        createdAt: string;
    };
}

// Notification sound generator using Web Audio API
const playNotificationSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create a pleasant notification sound (management-style chime)
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Set frequencies for a professional management chime
        oscillator1.frequency.setValueAtTime(660, audioContext.currentTime); // E5
        oscillator1.frequency.setValueAtTime(880, audioContext.currentTime + 0.15); // A5
        oscillator2.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        oscillator2.frequency.setValueAtTime(554, audioContext.currentTime + 0.15); // C#5

        oscillator1.type = 'sine';
        oscillator2.type = 'sine';

        // Volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.2);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.6);

        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.6);
        oscillator2.stop(audioContext.currentTime + 0.6);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleNewTicket = useCallback((ticket: TicketNotification) => {
        playNotificationSound();
        window.dispatchEvent(new CustomEvent('refreshTickets', { detail: ticket }));

        toast.custom((t) => (
            <div
                onClick={() => {
                    toast.dismiss(t);
                    navigate('/hr/tickets');
                }}
                className={`flex items-start gap-3 p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-lg transition-all ${ticket.priority === 'urgent' ? 'border-red-500 bg-red-50 dark:bg-red-950' :
                    ticket.priority === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' :
                        'border-primary bg-primary/5'
                    } bg-card shadow-md max-w-sm`}
            >
                <div className={`p-2 rounded-full ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                    ticket.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                        'bg-primary/10 text-primary'
                    }`}>
                    <Ticket className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm line-clamp-1">{ticket.ticketNumber}: {ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">From: {ticket.employee.firstName} {ticket.employee.lastName}</p>
                    <p className="text-xs text-primary mt-2 font-medium">Click to manage ticket →</p>
                </div>
            </div>
        ), { duration: 10000, position: 'top-right' });
    }, [navigate]);

    const handleNewMessage = useCallback((data: ChatMessageNotification) => {
        const isChatPage = window.location.pathname.includes('/chat');
        if (isChatPage) return;

        playNotificationSound();
        window.dispatchEvent(new CustomEvent('refreshMessages', { detail: data }));

        toast.custom((t) => (
            <div
                onClick={() => {
                    toast.dismiss(t);
                    const path = user?.role === 'hr' ? '/hr/chat' : '/boss/chat';
                    navigate(path);
                }}
                className="flex items-start gap-3 p-4 rounded-lg border-l-4 border-primary bg-card shadow-md max-w-sm cursor-pointer hover:shadow-lg transition-all"
            >
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{data.message.sender.email}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{data.message.content}</p>
                </div>
            </div>
        ), { duration: 5000, position: 'top-right' });
    }, [navigate, user]);

    const handleNewMessageRequest = useCallback((data: any) => {
        const isChatPage = window.location.pathname.includes('/chat');
        if (isChatPage) return;

        playNotificationSound();
        window.dispatchEvent(new CustomEvent('refreshMessageRequests', { detail: data }));

        toast.custom((t) => (
            <div
                onClick={() => {
                    toast.dismiss(t);
                    const path = user?.role === 'hr' ? '/hr/chat' : '/boss/chat';
                    navigate(path);
                }}
                className="flex items-start gap-3 p-4 rounded-lg border-l-4 border-warning bg-card shadow-md max-w-sm cursor-pointer hover:shadow-lg transition-all"
            >
                <div className="p-2 rounded-full bg-warning/10 text-warning">
                    <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">New Message Request</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">An employee wants to start a conversation with you.</p>
                </div>
            </div>
        ), { duration: 7000, position: 'top-right' });
    }, [navigate, user]);

    const handleNewLeaveRequest = useCallback((data: LeaveNotification) => {
        const isLeavePage = window.location.pathname.includes('/leaves');

        playNotificationSound();
        window.dispatchEvent(new CustomEvent('refreshLeaves', { detail: data }));
        window.dispatchEvent(new CustomEvent('refreshLeaveCount'));

        toast.custom((t) => (
            <div
                onClick={() => {
                    toast.dismiss(t);
                    const path = user?.role === 'hr' ? '/hr/leaves' : '/boss/leaves';
                    navigate(path);
                }}
                className="flex items-start gap-3 p-4 rounded-lg border-l-4 border-warning bg-card shadow-md max-w-sm cursor-pointer hover:shadow-lg transition-all"
            >
                <div className="p-2 rounded-full bg-warning/10 text-warning">
                    <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">New Leave Request</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {data.employee.firstName} {data.employee.lastName} requested {data.totalDays} day(s) of {data.leaveType} leave.
                    </p>
                </div>
            </div>
        ), { duration: 8000, position: 'top-right' });
    }, [navigate, user]);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const socketUrl = apiUrl.replace('/api', '');

        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            auth: {
                token: localStorage.getItem('token')
            }
        });

        socketRef.current = socket;
        socket.emit('join', user.id);

        socket.on('newTicket', handleNewTicket);
        socket.on('newMessage', handleNewMessage);
        socket.on('newMessageRequest', handleNewMessageRequest);
        socket.on('newLeaveRequest', handleNewLeaveRequest);

        return () => {
            socket.off('newTicket', handleNewTicket);
            socket.off('newMessage', handleNewMessage);
            socket.off('newMessageRequest', handleNewMessageRequest);
            socket.off('newLeaveRequest', handleNewLeaveRequest);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, user, handleNewTicket, handleNewMessage, handleNewMessageRequest, handleNewLeaveRequest]);

    return <>{children}</>;
};
