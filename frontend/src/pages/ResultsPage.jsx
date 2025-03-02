import React, { useState, useEffect } from 'react';
import Typography from '@mui/joy/Typography';
import Grid from '@mui/joy/Grid';
import CircularProgress from '@mui/joy/CircularProgress';
import Box from '@mui/joy/Box';

// Import the components
import DiagnosisDisplay from '../components/DiagnosisDisplay';
import Recommendations from '../components/Recommendations';
import DiagnosticSummary from '../components/DiagnosticSummary';

const ResultsPage = () => {
    const [diagnoses, setDiagnoses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch diagnoses once on component mount
    useEffect(() => {
        const fetchDiagnoses = async () => {
            try {
                const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost') + '/diagnoses';
                const response = await fetch(API_URL);

                if (response.ok) {
                    const data = await response.json();
                    setDiagnoses(data.diagnoses || []);
                }
            } catch (error) {
                console.error("Error fetching diagnoses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDiagnoses();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Typography level="h2" sx={{ mb: 2 }}>Your personalized assessment</Typography>

            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                {/* Diagnoses Panel */}
                <Grid xs={12} md={6}>
                    <DiagnosisDisplay diagnoses={diagnoses} />
                </Grid>

                {/* Recommendations Panel */}
                <Grid xs={12} md={6}>
                    <Recommendations />
                </Grid>

                {/* Diagnostic Summary */}
                <Grid xs={12}>
                    <DiagnosticSummary diagnoses={diagnoses} />
                </Grid>
            </Grid>
        </>
    );
};

export default ResultsPage;