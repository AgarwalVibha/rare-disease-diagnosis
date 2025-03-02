import React, { useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Divider from '@mui/joy/Divider';
import CircularProgress from '@mui/joy/CircularProgress';
import Alert from '@mui/joy/Alert';
import UploadIcon from '@mui/icons-material/Upload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const FileUploader = ({ onAnalysisComplete = () => { } }) => {

    const API_URL = 'http://localhost/clinical-notes';

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', or null
    const [statusMessage, setStatusMessage] = useState('');

    const handleFileUpload = (event) => {
        const uploadedFile = event.target.files[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            setUploadStatus(null);
            setStatusMessage('');
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            setUploadStatus('error');
            setStatusMessage('Please select a file first');
            return;
        }

        try {
            setUploading(true);
            setUploadStatus(null);

            // Create FormData to send the file
            const formData = new FormData();
            formData.append('file', file);

            // You can add additional form fields if needed
            formData.append('patient_id', 'PATIENT123');
            formData.append('notes', 'Uploaded from web interface');

            // Send to API
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData,
                // No need to set Content-Type header, fetch will set it automatically with boundary
            });

            if (!response.ok) {
                throw new Error(`Upload failed with status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setUploadStatus('success');
                setStatusMessage('Clinical notes processed successfully');

                // Pass analysis results to parent component
                onAnalysisComplete(data);
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        } catch (error) {
            setUploadStatus('error');
            setStatusMessage(`Error: ${error.message}`);
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography level="title-lg" startDecorator={<UploadIcon />}>
                    Upload Clinical Notes
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '200px',
                        border: '2px dashed',
                        borderColor: 'neutral.outlinedBorder',
                        borderRadius: 'md',
                        p: 2,
                        mb: 2
                    }}
                >
                    {uploading ? (
                        <CircularProgress size="lg" />
                    ) : (
                        <>
                            <UploadIcon sx={{ fontSize: 40, mb: 2, color: 'primary.500' }} />
                            <Typography level="body-sm" sx={{ mb: 1 }}>
                                Drag and drop your file here or
                            </Typography>
                            <Button
                                component="label"
                                color="primary"
                                variant="soft"
                                startDecorator={<UploadIcon />}
                            >
                                Browse Files
                                <input
                                    type="file"
                                    hidden
                                    onChange={handleFileUpload}
                                    accept=".txt"
                                />
                            </Button>
                        </>
                    )}
                </Box>

                {file && !uploading && !uploadStatus && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Typography level="body-sm">
                            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </Typography>
                        <Button
                            color="primary"
                            onClick={handleSubmit}
                            startDecorator={<UploadIcon />}
                        >
                            Upload and Analyze
                        </Button>
                    </Box>
                )}

                {uploadStatus === 'success' && (
                    <Alert
                        color="success"
                        startDecorator={<CheckCircleIcon />}
                        sx={{ mt: 2 }}
                    >
                        {statusMessage}
                    </Alert>
                )}

                {uploadStatus === 'error' && (
                    <Alert
                        color="danger"
                        startDecorator={<ErrorIcon />}
                        sx={{ mt: 2 }}
                    >
                        {statusMessage}
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default FileUploader;