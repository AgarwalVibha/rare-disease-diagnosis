import React, { useState } from 'react';
import Typography from '@mui/joy/Typography';
import Grid from '@mui/joy/Grid';
import Stack from '@mui/joy/Stack';

// Import the extracted components from components directory
import FileUploader from '../components/FileUploader';
import ChatInterface from '../components/ChatInterface';
import HPOCodesPanel from '../components/HPOCodesPanel';
import CodesUploader from '../components/CodesUploader';

const InputsPage = () => {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hello! I can help identify possible rare disease diagnoses. Can you tell me about your main symptoms or upload clinical notes?' }
    ]);
    const [messageInput, setMessageInput] = useState('');
    const [hpoCodes, setHpoCodes] = useState([]);

    // Handle sending a message in the chat
    const handleSendMessage = () => {
        if (messageInput.trim() === '') return;

        // Add user message to chat
        setMessages([...messages, { sender: 'user', text: messageInput }]);

        // Add a "thinking" message
        setTimeout(() => {
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: 'Thank you for sharing. Based on that symptom, I would like to know if you also experience joint hypermobility or skin elasticity issues?'
            }]);
        }, 1000);

        setMessageInput('');
    };

    // Handle the results from the clinical notes analysis
    const handleAnalysisComplete = (results) => {
        // Update the chat with analysis results
        const newMessages = [
            ...messages,
            {
                sender: 'bot',
                text: `I've analyzed your clinical notes. Based on the analysis, I've identified several potential diagnoses. The top candidate is ${results.potential_diagnoses[0].name} with a ${results.potential_diagnoses[0].probability} probability.`
            }
        ];

        // Add additional message with recommendations
        newMessages.push({
            sender: 'bot',
            text: 'I recommend consulting with specialists and conducting further tests. You can view the full analysis results in the Results tab.'
        });

        setMessages(newMessages);
    };

    // Function to update HPO codes when they change in any component
    const handleHPOCodesUpdate = (updatedCodes) => {
        setHpoCodes(updatedCodes);
    };

    return (
        <>
            <Typography level="h2" sx={{ mb: 2 }}>Patient Information Input</Typography>

            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                {/* Left Column - File Upload and HPO Code Upload stacked */}
                <Grid xs={12} md={4}>
                    <Stack spacing={2} sx={{ height: '100%' }}>
                        <FileUploader
                            onAnalysisComplete={handleAnalysisComplete}
                            onHPOCodesUpdate={handleHPOCodesUpdate}
                        />
                        <CodesUploader onHPOCodesUpdate={handleHPOCodesUpdate} />
                    </Stack>
                </Grid>

                {/* Middle Column - Chat Interface */}
                <Grid xs={12} md={4}>
                    <ChatInterface
                        messages={messages}
                        messageInput={messageInput}
                        setMessageInput={setMessageInput}
                        handleSendMessage={handleSendMessage}
                        sx={{ height: '100%' }}
                    />
                </Grid>

                {/* Right Column - HPO Codes Panel */}
                <Grid xs={12} md={4}>
                    <HPOCodesPanel
                        hpoCodes={hpoCodes}
                        sx={{ height: '100%' }}
                    />
                </Grid>
            </Grid>
        </>
    );
};

export default InputsPage;