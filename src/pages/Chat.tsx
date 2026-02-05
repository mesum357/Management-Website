import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Image,
  Check,
  CheckCheck,
  Circle,
  Loader2,
  AlertCircle,
  UserPlus,
  X,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { chatAPI, messageRequestAPI, resolveSocketUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";

interface ChatUser {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  department?: { _id: string; name: string };
  designation?: string;
  avatar?: string;
  displayName: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeId?: string;
    department?: { _id: string; name: string };
    designation?: string;
    avatar?: string;
  };
}

interface Message {
  _id: string;
  sender: { _id: string; email: string } | string;
  content: string;
  messageType?: string;
  attachments?: Array<{
    name: string;
    url: string;
    attachmentType?: string;
    type: string;
    size?: number;
  }>;
  createdAt: string;
  readBy?: Array<{ user: string }>;
  isDeleted?: boolean;
}

interface Chat {
  _id: string;
  chatType: string;
  participants: ChatUser[];
  lastMessage?: {
    content: string;
    sender: { _id: string; email: string };
    createdAt: string;
  };
  messages?: Message[];
  unreadCount?: number;
}

const Chat = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [messageRequests, setMessageRequests] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!user?.id) return;

    const socketUrl = resolveSocketUrl();
    console.log('[Chat] Connecting to socket at:', socketUrl);

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('admin_token')
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Join user's personal room
    socket.emit('join', user.id);

    // Listen for new messages
    const handleNewMessage = (data: { chatId: string; message: Message }) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(m => m._id === data.message._id);
          if (messageExists) {
            return prev;
          }
          return [...prev, data.message];
        });
        scrollToBottom();
      }

      // Update chat list
      fetchChats();
      window.dispatchEvent(new CustomEvent('refreshMessages'));
    };

    socket.on('newMessage', handleNewMessage);

    // Listen for new message requests (boss only)
    const handleNewMessageRequest = (data: { requestId: string; from: any }) => {
      if (user?.role === 'boss') {
        fetchMessageRequests();
        window.dispatchEvent(new CustomEvent('refreshMessageRequests'));
      }
    };

    socket.on('newMessageRequest', handleNewMessageRequest);

    // Listen for message request accepted/rejected
    const handleMessageRequestAccepted = (data: { requestId: string; chatId: string }) => {
      fetchMessageRequests();
      fetchChats();
    };

    const handleMessageRequestRejected = (data: { requestId: string }) => {
      fetchMessageRequests();
    };

    socket.on('messageRequestAccepted', (data: any) => {
      handleMessageRequestAccepted(data);
      window.dispatchEvent(new CustomEvent('refreshMessageRequests'));
      window.dispatchEvent(new CustomEvent('refreshMessages'));
    });
    socket.on('messageRequestRejected', (data: any) => {
      handleMessageRequestRejected(data);
      window.dispatchEvent(new CustomEvent('refreshMessageRequests'));
    });

    // Handle typing indicators
    socket.on('userTyping', (data: { userId: string; chatId: string; isTyping: boolean }) => {
      // Can implement typing indicator here
    });

    // Handle connection status
    socket.on('connect', () => {
      console.log('Connected to socket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('newMessageRequest', handleNewMessageRequest);
      socket.off('messageRequestAccepted', handleMessageRequestAccepted);
      socket.off('messageRequestRejected', handleMessageRequestRejected);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]); // Only depend on user.id, not selectedChat

  // Fetch all users and chats on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, chatsRes] = await Promise.all([
        chatAPI.getChatUsers(),
        chatAPI.getAll(),
      ]);

      setUsers(usersRes.data.data.users || []);
      setChats(chatsRes.data.data.chats || []);

      // Fetch message requests if boss
      if (user?.role === 'boss') {
        fetchMessageRequests();
      }
    } catch (err: any) {
      console.error('Error fetching chat data:', err);
      setError(err.response?.data?.message || 'Failed to load chat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageRequests = async () => {
    try {
      const res = await messageRequestAPI.getAll();
      setMessageRequests(res.data.data.incoming || []);
    } catch (err: any) {
      console.error('Error fetching message requests:', err);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await messageRequestAPI.accept(requestId);
      if (res.data.data.chat) {
        // Load the chat
        const chat = res.data.data.chat;
        const messagesRes = await chatAPI.getById(chat._id);
        const chatWithMessages = messagesRes.data.data.chat;
        setSelectedChat(chatWithMessages);
        setMessages(chatWithMessages.messages?.filter((m: Message) => !m.isDeleted) || []);
        setShowMobileChat(true);
      }
      fetchMessageRequests();
      fetchChats();
      window.dispatchEvent(new CustomEvent('refreshMessageRequests'));
      window.dispatchEvent(new CustomEvent('refreshMessages'));
    } catch (err: any) {
      console.error('Error accepting request:', err);
      setError(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await messageRequestAPI.reject(requestId);
      fetchMessageRequests();
      window.dispatchEvent(new CustomEvent('refreshMessageRequests'));
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const fetchChats = async () => {
    try {
      const chatsRes = await chatAPI.getAll();
      setChats(chatsRes.data.data.chats || []);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
    }
  };

  const handleSelectUser = async (selectedUser: ChatUser) => {
    try {
      setLoading(true);

      // Create or get existing private chat
      const response = await chatAPI.createPrivate(selectedUser._id);
      const chat = response.data.data.chat;

      // Fetch messages for this chat
      const messagesRes = await chatAPI.getById(chat._id);
      const chatWithMessages = messagesRes.data.data.chat;

      setSelectedChat(chatWithMessages);
      setMessages(chatWithMessages.messages?.filter((m: Message) => !m.isDeleted) || []);
      setShowMobileChat(true);

      // Refresh chats list
      fetchChats();
    } catch (err: any) {
      console.error('Error creating/loading chat:', err);
      setError(err.response?.data?.message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (chat: Chat) => {
    try {
      setLoading(true);

      // Fetch messages for this chat
      const messagesRes = await chatAPI.getById(chat._id);
      const chatWithMessages = messagesRes.data.data.chat;

      setSelectedChat(chatWithMessages);
      setMessages(chatWithMessages.messages?.filter((m: Message) => !m.isDeleted) || []);
      setShowMobileChat(true);
      window.dispatchEvent(new CustomEvent('refreshMessages'));
    } catch (err: any) {
      console.error('Error loading chat:', err);
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate file types
    if (isImage) {
      const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        setError('Please select image files only');
        return;
      }
      setSelectedFiles(prev => [...prev, ...imageFiles]);
    } else {
      setSelectedFiles(prev => [...prev, ...fileArray]);
    }

    // Upload files immediately
    try {
      setUploading(true);
      setError(null);

      const uploadPromises = fileArray.map(async (file) => {
        try {
          const response = await chatAPI.uploadFile(file);
          return response.data.data;
        } catch (err: any) {
          console.error('Error uploading file:', err);
          throw err;
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setUploadedAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (err: any) {
      console.error('Error uploading files:', err);
      setError(err.response?.data?.message || 'Failed to upload file(s)');
      // Remove failed files from selected files
      setSelectedFiles(prev => prev.filter(f => !fileArray.includes(f)));
    } finally {
      setUploading(false);
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setUploadedAttachments(prev => prev.filter((_, i) => i !== index));
    // Also remove corresponding file from selectedFiles if possible
    if (index < selectedFiles.length) {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && uploadedAttachments.length === 0) || !selectedChat || sending || uploading) return;

    const messageContent = messageInput.trim();
    const attachmentsToSend = [...uploadedAttachments];

    // Clear inputs immediately for better UX
    setMessageInput("");
    setUploadedAttachments([]);
    setSelectedFiles([]);

    try {
      setSending(true);

      const response = await chatAPI.sendMessage(
        selectedChat._id,
        messageContent,
        attachmentsToSend.length > 0 ? (attachmentsToSend.some(a => a.type === 'image') ? 'image' : 'file') : 'text',
        attachmentsToSend
      );

      if (response.data.success) {
        // Add message immediately for sender (optimistic update)
        // Other participants will receive via socket
        const newMessage = response.data.data.message;
        setMessages(prev => {
          // Double-check to prevent duplicates (in case socket also emits)
          const exists = prev.some(m => m._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        scrollToBottom();

        // Update chat list to update last message
        fetchChats();
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
      // Restore inputs on error
      setMessageInput(messageContent);
      setUploadedAttachments(attachmentsToSend);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = (chat: Chat): ChatUser | null => {
    if (!user) return null;
    const other = chat.participants.find(p => p._id.toString() !== user.id);
    if (!other) return null;

    // Format participant data
    if (other.employee) {
      return {
        _id: other._id,
        email: other.email,
        role: other.role,
        firstName: other.employee.firstName,
        lastName: other.employee.lastName,
        employeeId: other.employee.employeeId,
        department: other.employee.department,
        designation: other.employee.designation,
        avatar: other.employee.avatar,
        displayName: `${other.employee.firstName} ${other.employee.lastName}`
      };
    }

    return {
      _id: other._id,
      email: other.email,
      role: other.role,
      firstName: other.firstName || other.email.split('@')[0],
      lastName: other.lastName || '',
      displayName: other.displayName || other.firstName || other.email.split('@')[0]
    };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAvatarInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isMessageRead = (message: Message) => {
    if (!user || typeof message.sender === 'string') return false;
    if (message.sender._id.toString() === user.id) return true;
    return message.readBy?.some(r => r.user.toString() === user.id) || false;
  };

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChats = chats.filter(chat => {
    const otherUser = getOtherParticipant(chat);
    if (!otherUser) return false;
    return (
      otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUser.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading && !selectedChat) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const otherUser = selectedChat ? getOtherParticipant(selectedChat) : null;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 md:gap-6 relative overflow-hidden">
      {/* Users/Chats List */}
      <Card className={cn(
        "w-full md:w-80 flex-shrink-0 flex flex-col overflow-hidden",
        showMobileChat && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Message Requests (Boss only) */}
            {user?.role === 'boss' && messageRequests.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground px-3 py-2">Message Requests</p>
                {messageRequests.map((request: any) => {
                  const requester = request.from;
                  const requesterName = requester.employee
                    ? `${requester.employee.firstName} ${requester.employee.lastName}`
                    : requester.email.split('@')[0];

                  return (
                    <div
                      key={request._id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 mb-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {getAvatarInitials(requesterName)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{requesterName}</p>
                        <p className="text-xs text-muted-foreground truncate italic">wants to message you</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleAcceptRequest(request._id)}
                        >
                          <Check className="w-4 h-4 text-success" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleRejectRequest(request._id)}
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Existing Chats */}
            {filteredChats.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground px-3 py-2">Recent Chats</p>
                {filteredChats.map((chat) => {
                  const other = getOtherParticipant(chat);
                  if (!other) return null;

                  return (
                    <button
                      key={chat._id}
                      onClick={() => handleSelectChat(chat)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left mb-2",
                        selectedChat?._id === chat._id
                          ? "bg-primary/10"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {getAvatarInitials(other.displayName)}
                          </span>
                        </div>
                        {onlineUsers.has(other._id) && (
                          <Circle className="absolute bottom-0 right-0 w-4 h-4 text-success fill-success bg-card rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground truncate">{other.displayName}</p>
                          {chat.lastMessage && (
                            <span className="text-caption text-xs">{formatTime(chat.lastMessage.createdAt)}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-small text-muted-foreground truncate">
                            {chat.lastMessage?.content || 'No messages yet'}
                          </p>
                          {chat.lastMessage &&
                            chat.lastMessage.sender._id.toString() !== user?.id &&
                            !isMessageRead({ ...chat.lastMessage, readBy: [] } as Message) && (
                              <Badge className="bg-primary text-primary-foreground min-w-[20px] h-5 flex items-center justify-center text-xs">
                                1
                              </Badge>
                            )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* All Users */}
            <div>
              <p className="text-xs font-medium text-muted-foreground px-3 py-2">
                {filteredChats.length > 0 ? 'All Users' : 'Start a Conversation'}
              </p>
              {filteredUsers.map((chatUser) => {
                const existingChat = chats.find(c => {
                  const other = getOtherParticipant(c);
                  return other?._id === chatUser._id;
                });

                if (existingChat) return null; // Already shown in recent chats

                return (
                  <button
                    key={chatUser._id}
                    onClick={() => handleSelectUser(chatUser)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left mb-2",
                      selectedChat && getOtherParticipant(selectedChat)?._id === chatUser._id
                        ? "bg-primary/10"
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {getAvatarInitials(chatUser.displayName)}
                        </span>
                      </div>
                      {onlineUsers.has(chatUser._id) && (
                        <Circle className="absolute bottom-0 right-0 w-4 h-4 text-success fill-success bg-card rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground truncate">{chatUser.displayName}</p>
                        {chatUser.role && chatUser.role !== 'employee' && (
                          <Badge variant="outline" className="text-xs">
                            {chatUser.role.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-small text-muted-foreground truncate mt-1">
                        {chatUser.designation || chatUser.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredUsers.length === 0 && filteredChats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      {selectedChat && otherUser ? (
        <Card className={cn(
          "flex-1 flex flex-col overflow-hidden bg-card",
          !showMobileChat && "hidden md:flex"
        )}>
          {/* Chat Header */}
          <div className="p-3 md:p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden -ml-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowMobileChat(false)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {getAvatarInitials(otherUser.displayName)}
                  </span>
                </div>
                {onlineUsers.has(otherUser._id) && (
                  <Circle className="absolute bottom-0 right-0 w-3 h-3 text-success fill-success bg-card rounded-full" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{otherUser.displayName}</p>
                <p className="text-caption truncate">
                  {onlineUsers.has(otherUser._id) ? "Online" : otherUser.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                <Phone className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                <Video className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMe = typeof message.sender === 'object'
                    ? message.sender._id.toString() === user?.id
                    : message.sender === user?.id;
                  const senderName = typeof message.sender === 'object'
                    ? message.sender.email
                    : 'Unknown';

                  return (
                    <div
                      key={message._id}
                      className={cn(
                        "flex",
                        isMe ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-3",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-foreground rounded-bl-md"
                        )}
                      >
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mb-2 space-y-2">
                            {message.attachments.map((attachment, idx) => {
                              const getFullUrl = (url: string) => {
                                if (url.startsWith('http')) return url;
                                const baseUrl = resolveSocketUrl();
                                return `${baseUrl}${url}`;
                              };

                              const fileUrl = getFullUrl(attachment.url);

                              return (
                                <div key={idx} className="rounded-lg overflow-hidden">
                                  {(attachment.attachmentType === 'image' || attachment.type === 'image') ? (
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block"
                                    >
                                      <img
                                        src={fileUrl}
                                        alt={attachment.name}
                                        className="max-w-full max-h-64 rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                        "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                                        isMe
                                          ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20"
                                          : "bg-background border-border hover:bg-accent"
                                      )}
                                    >
                                      <Paperclip className="w-4 h-4 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                                        {attachment.size && (
                                          <p className="text-xs text-muted-foreground">
                                            {(attachment.size / 1024).toFixed(2)} KB
                                          </p>
                                        )}
                                      </div>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          isMe ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-xs",
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {formatMessageTime(message.createdAt)}
                          </span>
                          {isMe && (
                            isMessageRead(message)
                              ? <CheckCheck className="w-4 h-4 text-primary-foreground/70" />
                              : <Check className="w-4 h-4 text-primary-foreground/70" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            {error && (
              <div className="mb-2 bg-destructive/10 border border-destructive/20 rounded-lg p-2 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Show uploaded attachments preview */}
            {uploadedAttachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {uploadedAttachments.map((attachment, idx) => (
                  <div
                    key={idx}
                    className="relative inline-flex items-center gap-2 p-2 bg-secondary rounded-lg border border-border"
                  >
                    {attachment.type === 'image' ? (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-xs max-w-[100px] truncate">{attachment.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e, false)}
                multiple
                accept="*/*"
                className="hidden"
              />
              <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => handleFileSelect(e, true)}
                multiple
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading || sending}
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Image className="w-5 h-5" />
                )}
              </Button>
              <Input
                placeholder="Type a message..."
                className="flex-1"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sending || uploading}
              />
              <Button variant="ghost" size="icon" type="button">
                <Smile className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                type="button"
                disabled={(!messageInput.trim() && uploadedAttachments.length === 0) || sending || uploading}
                onClick={handleSendMessage}
              >
                {sending || uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Circle className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a user to start chatting</p>
            <p className="text-sm mt-2">Choose someone from the list to begin a conversation</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Chat;

