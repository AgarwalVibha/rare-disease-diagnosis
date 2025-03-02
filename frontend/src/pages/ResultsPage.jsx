import React from 'react';
import Typography from '@mui/joy/Typography';
import Grid from '@mui/joy/Grid';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Divider from '@mui/joy/Divider';
import Box from '@mui/joy/Box';

// Import the extracted components from components directory
import DiagnosisDisplay from '../components/DiagnosisDisplay';
import Recommendations from '../components/Recommendations';

const ResultsPage = ({ diagnoses }) => {
    return (
        <>
            <Typography level="h2" sx={{ mb: 2 }}>Your personalized assessment</Typography>

            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                {/* Diagnoses Table Panel */}
                <Grid xs={12} md={6}>
                    <DiagnosisDisplay diagnoses={diagnoses} />
                </Grid>

                {/* Recommendations Panel - Now fetches data from API */}
                <Grid xs={12} md={6}>
                    <Recommendations />
                </Grid>

                {/* Additional Information Card */}
                <Grid xs={12}>
                    <Card>
                        <CardContent>
                            <Typography level="title-lg">
                                Diagnostic Summary
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography level="body-md">
                                Based on the provided symptoms and clinical notes, we've identified several potential
                                rare disease diagnoses. The top candidate is Ehlers-Danlos Syndrome, which matches many
                                of the described symptoms including joint hypermobility and skin elasticity issues.
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography level="title-sm">Important Notes:</Typography>
                                <Typography level="body-sm">
                                    • These are preliminary results and should be confirmed by specialists<br />
                                    • Follow the recommended next steps to reach a conclusive diagnosis<br />
                                    • Additional testing may be required based on specialist consultations
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
};

export default ResultsPage;