import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import CardActions from '@mui/joy/CardActions';
import Divider from '@mui/joy/Divider';
import Input from '@mui/joy/Input';
import IconButton from '@mui/joy/IconButton';
import Button from '@mui/joy/Button';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import CircularProgress from '@mui/joy/CircularProgress';
import Alert from '@mui/joy/Alert';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(localStorage.getItem('chatSessionId') || null);
    const messagesEndRef = useRef(null);

    // API URL based on your setup
    const API_URL = 'http://localhost';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll to bottom whenever messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load saved messages when component mounts
    useEffect(() => {
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
            } catch (e) {
                console.error('Error parsing saved messages', e);
                localStorage.removeItem('chatMessages');
            }
        }
    }, []);

    // Save messages to localStorage when they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chatMessages', JSON.stringify(messages));
        }
    }, [messages]);

    // Save session ID when it changes
    useEffect(() => {
        if (sessionId) {
            localStorage.setItem('chatSessionId', sessionId);
        }
    }, [sessionId]);

    // Initialize chat when component mounts
    useEffect(() => {
        if (!sessionId || messages.length === 0) {
            startChat();
        } else {
            setLoading(false);
        }
    }, []);

    const startChat = async () => {
        setLoading(true);
        setError(null);

        try {
            // Include session ID in request if we have one
            const url = sessionId
                ? `${API_URL}/start-chat?session_id=${sessionId}`
                : `${API_URL}/start-chat`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Save the new session ID
            setSessionId(data.session_id);

            // Only set welcome message if we don't have messages already
            if (messages.length === 0) {
                setMessages([
                    { sender: 'assistant', text: data.message }
                ]);
            }
        } catch (err) {
            console.error('Error starting chat:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;

        // Add user message to chat
        const userMessage = { sender: 'user', text: messageInput };
        setMessages(prevMessages => [...prevMessages, userMessage]);

        // Clear input field
        setMessageInput('');

        // Add temporary loading indicator
        setMessages(prevMessages => [
            ...prevMessages,
            { sender: 'assistant', isLoading: true }
        ]);

        try {
            const response = await fetch(`${API_URL}/send-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: userMessage.text,
                    session_id: sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Replace loading indicator with actual response
            setMessages(prevMessages =>
                prevMessages
                    .filter(msg => !msg.isLoading)
                    .concat([{ sender: 'assistant', text: data.message }])
            );
        } catch (err) {
            console.error('Error sending message:', err);

            // Replace loading indicator with error message
            setMessages(prevMessages =>
                prevMessages
                    .filter(msg => !msg.isLoading)
                    .concat([{ sender: 'assistant', text: `Sorry, there was an error communicating with the server.` }])
            );
        }
    };

    // Handle Enter key press in input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && messageInput.trim() && !loading) {
            handleSendMessage();
        }
    };

    // Add a reset chat function
    const resetChat = () => {
        localStorage.removeItem('chatMessages');
        localStorage.removeItem('chatSessionId');
        setSessionId(null);
        setMessages([]);
        startChat();
    };

    if (loading && messages.length === 0) {
        return (
            <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress />
            </Card>
        );
    }

    if (error) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Alert
                        startDecorator={<WarningIcon />}
                        variant="soft"
                        color="danger"
                        sx={{ mb: 2 }}
                    >
                        Error connecting to chat service: {error}
                    </Alert>
                    <Button
                        onClick={startChat}
                        variant="soft"
                    >
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography level="title-lg" startDecorator={<ChatIcon />}>
                        Symptom Assessment
                    </Typography>
                    <IconButton
                        variant="soft"
                        color="neutral"
                        size="sm"
                        onClick={resetChat}
                        title="Reset Chat"
                    >
                        <RefreshIcon />
                    </IconButton>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '300px',
                        overflow: 'auto',
                        mb: 2
                    }}
                >
                    {messages.map((message, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                mb: 2
                            }}
                        >
                            {message.isLoading ? (
                                <CircularProgress size="sm" sx={{ m: 2 }} />
                            ) : (
                                <Sheet
                                    variant="soft"
                                    color={message.sender === 'user' ? 'primary' : 'neutral'}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 'lg',
                                        maxWidth: '80%',
                                        whiteSpace: 'pre-line' // Preserve line breaks
                                    }}
                                >
                                    <Typography level="body-sm">{message.text}</Typography>
                                </Sheet>
                            )}
                        </Box>
                    ))}
                    <div ref={messagesEndRef} />
                </Box>
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
                <Input
                    placeholder="Share your symptoms..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    sx={{ flexGrow: 1 }}
                    disabled={loading}
                    endDecorator={
                        <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim() || loading}
                        >
                            <SendIcon />
                        </IconButton>
                    }
                />
            </CardActions>
        </Card>
    );
};

export default ChatInterface;