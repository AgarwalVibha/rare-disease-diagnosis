import React, { useState, useEffect } from 'react';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Divider from '@mui/joy/Divider';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import CircularProgress from '@mui/joy/CircularProgress';
import Alert from '@mui/joy/Alert';
import ScienceIcon from '@mui/icons-material/Science';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import BiotechIcon from '@mui/icons-material/Biotech';
import ImageIcon from '@mui/icons-material/Image';
import WarningIcon from '@mui/icons-material/Warning';

const Recommendations = ({ initialRecommendations = [] }) => {
    const [recommendations, setRecommendations] = useState(initialRecommendations);
    const [loading, setLoading] = useState(initialRecommendations.length === 0);
    const [error, setError] = useState(null);

    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost') + '/recommendations';

    // Get icon based on recommendation type
    const getTypeIcon = (type) => {
        switch (type) {
            case 'Specialist':
                return <MedicalServicesIcon sx={{ color: 'text.secondary' }} />;
            case 'Lab Test':
                return <BiotechIcon sx={{ color: 'text.secondary' }} />;
            case 'Genetic':
                return <BiotechIcon sx={{ color: 'text.secondary' }} />;
            case 'Imaging':
                return <ImageIcon sx={{ color: 'text.secondary' }} />;
            default:
                return <ScienceIcon sx={{ color: 'text.secondary' }} />;
        }
    };

    useEffect(() => {
        // Skip API call if we already have recommendations from props
        if (initialRecommendations.length > 0) {
            setRecommendations(initialRecommendations);
            setLoading(false);
            return;
        }

        let isMounted = true;
        const fetchRecommendations = async () => {
            try {
                const response = await fetch(API_URL);

                // Only update state if component is still mounted
                if (!isMounted) return;

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();

                // Handle both data formats: {recommendations: [...]} or directly [...]
                if (data && data.recommendations) {
                    setRecommendations(data.recommendations);
                } else if (Array.isArray(data)) {
                    setRecommendations(data);
                } else {
                    // If we get here, we received a response but in an unexpected format
                    console.error("Unexpected API response format:", data);
                    setError("Invalid data format received from API");
                    setRecommendations([]);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching recommendations:', err);
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchRecommendations();

        // Cleanup function to prevent state updates if component unmounts
        return () => {
            isMounted = false;
        };
    }, []); // Empty dependency array - only run once on mount

    if (loading) {
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
                        Error loading recommendations: {error}
                    </Alert>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="soft"
                    >
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography level="title-md" startDecorator={<ScienceIcon />} sx={{ mb: 2 }}>
                    Recommended Next Steps
                </Typography>
                <Divider />

                {recommendations.length === 0 ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '120px',
                        p: 2,
                        textAlign: 'center'
                    }}>
                        <Typography level="body-sm" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                            No recommendations available. We need more information to suggest next steps.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        {recommendations.map((rec, index) => (
                            <Box
                                key={rec.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    py: 2,
                                    borderBottom: index < recommendations.length - 1 ? '1px solid' : 'none',
                                    borderColor: 'divider',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40 }}>
                                        {getTypeIcon(rec.type)}
                                    </Box>
                                    <Box>
                                        <Typography level="title-sm">
                                            {rec.title}
                                        </Typography>
                                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                            Urgency: {rec.urgency}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button
                                    variant="soft"
                                    size="sm"
                                    sx={{ minWidth: '90px' }}
                                >
                                    Schedule
                                </Button>
                            </Box>
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default Recommendations;