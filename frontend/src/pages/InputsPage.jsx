import React from 'react';
import Typography from '@mui/joy/Typography';
import Grid from '@mui/joy/Grid';
import Stack from '@mui/joy/Stack';

// Import the extracted components from components directory
import FileUploader from '../components/FileUploader';
import ChatInterface from '../components/ChatInterface';
import HPOCodesPanel from '../components/HPOCodesPanel';
import CodesUploader from '../components/CodesUploader';

const InputsPage = () => {
    // Handle the results from the clinical notes analysis
    const handleAnalysisComplete = (results) => {
        console.log('Analysis complete:', results);
        // You might want to inform the user about the analysis completion
        // or update some other part of the UI
    };

    // Function to update HPO codes when they change in any component
    const handleHPOCodesUpdate = (updatedCodes) => {
        console.log('HPO codes updated:', updatedCodes);
        // HPO codes are now fetched directly by the HPOCodesPanel
        // This function can be used for cross-component communication if needed
    };

    return (
        <>
            <Typography level="h2" sx={{ mb: 1 }}>Your diagnostic journey</Typography>
            <Typography level="body-md" sx={{ mb: 3, color: 'text.secondary' }}>
                Every detail of your medical history matters on the path to understanding your rare condition. Share your clinical notes, gene test results, and symptom observations to enhance our diagnostic accuracy.
            </Typography>

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
                        sx={{ height: '100%' }}
                    />
                </Grid>

                {/* Right Column - HPO Codes Panel */}
                <Grid xs={12} md={4}>
                    <HPOCodesPanel
                        sx={{ height: '100%' }}
                    />
                </Grid>
            </Grid>
        </>
    );
};

export default InputsPage;