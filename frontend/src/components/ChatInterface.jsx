import React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import CardActions from '@mui/joy/CardActions';
import Divider from '@mui/joy/Divider';
import Input from '@mui/joy/Input';
import IconButton from '@mui/joy/IconButton';
import SendIcon from '@mui/icons-material/Send';

const ChatInterface = ({ messages, messageInput, setMessageInput, handleSendMessage }) => {
    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography level="title-lg">
                    Symptom Assessment
                </Typography>
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
                            <Sheet
                                variant="soft"
                                color={message.sender === 'user' ? 'primary' : 'neutral'}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 'lg',
                                    maxWidth: '80%'
                                }}
                            >
                                <Typography level="body-sm">{message.text}</Typography>
                            </Sheet>
                        </Box>
                    ))}
                </Box>
            </CardContent>
            <CardActions>
                <Input
                    placeholder="Type your symptoms..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    sx={{ flexGrow: 1 }}
                    endDecorator={
                        <IconButton color="primary" onClick={handleSendMessage}>
                            <SendIcon />
                        </IconButton>
                    }
                />
            </CardActions>
        </Card>
    );
};

export default ChatInterface;