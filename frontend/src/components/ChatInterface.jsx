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
    const [scriptStep, setScriptStep] = useState(0);
    // API URL that works both locally and in production
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost';
    const messagesEndRef = useRef(null);

    // Scripted responses following the EDS conversation
    const scriptedResponses = [
        "Hello! I'm here to help identify potential rare disease phenotypes based on your symptoms. Please describe what symptoms you're experiencing in as much detail as possible.",
        "I'm sorry to hear that. Do you mean your fingers, elbows, knees, ankles, and/or shoulders?",
        "I understand. Do these joints hurt during daily activities, during stressful events, or with physical activity?",
        "Thanks for sharing. Would you say you're flexible?",
        "That's helpful information. At what age did you notice this flexibility?",
        "It sounds like you have joint hypermobility (HP:0001382). Can I add this to your list of known symptoms?",
        "I have a few more questions to determine if you also have joint subluxation/dislocation (HP:0001373). Do you wish to continue?"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll to bottom whenever messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize chat when component mounts
    useEffect(() => {
        startChat();
    }, []);

    const startChat = async () => {
        setLoading(true);
        setError(null);
        setScriptStep(0);

        try {
            // Initialize with first system message
            setMessages([
                { sender: 'assistant', text: scriptedResponses[0] }
            ]);
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

        // Simulate API call delay
        setTimeout(() => {
            const nextStep = scriptStep + 1;

            if (nextStep < scriptedResponses.length) {
                // Get next scripted response
                const responseText = scriptedResponses[nextStep];

                // Special case: After user confirms "sure" to adding the HPO code (after step 5)
                if (scriptStep === 5) {
                    // Make API call to add the HPO code
                    try {
                        console.log('Attempting to add HPO code HP:0001382');
                        fetch(`${API_BASE_URL}/hpo-codes`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify([
                                {
                                    id: "HP:0001382",
                                    name: "To be looked up by backend",
                                    source: "Symptom Assessment"
                                }
                            ])
                        })
                            .then(response => {
                                console.log('API response status:', response.status);
                                if (!response.ok) {
                                    throw new Error(`API error: ${response.status}`);
                                }
                                return response.json();
                            })
                            .then(data => {
                                console.log('Successfully added HPO code:', data);
                            })
                            .catch(error => {
                                console.error('Error adding HPO code:', error);
                            });
                    } catch (error) {
                        console.error('Error making API call:', error);
                    }
                }

                // Replace loading indicator with scripted response
                setMessages(prevMessages =>
                    prevMessages
                        .filter(msg => !msg.isLoading)
                        .concat([{ sender: 'assistant', text: responseText }])
                );

                // Update script step for next user message
                setScriptStep(nextStep);
            } else {
                // If we've run out of scripted responses, loop back or provide a default
                setMessages(prevMessages =>
                    prevMessages
                        .filter(msg => !msg.isLoading)
                        .concat([{ sender: 'assistant', text: "Thank you for providing this information. I've recorded your symptoms. Is there anything else you'd like to share?" }])
                );
            }
        }, 1000); // 1 second delay to simulate processing
    };

    // Handle Enter key press in input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && messageInput.trim() && !loading) {
            handleSendMessage();
        }
    };

    // Add a reset chat function
    const resetChat = () => {
        setMessages([]);
        setScriptStep(0);
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