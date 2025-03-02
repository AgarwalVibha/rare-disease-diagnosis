import React, { useState, useEffect } from 'react';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Divider from '@mui/joy/Divider';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemContent from '@mui/joy/ListItemContent';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import Button from '@mui/joy/Button';
import CircularProgress from '@mui/joy/CircularProgress';
import Alert from '@mui/joy/Alert';
import ScienceIcon from '@mui/icons-material/Science';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import WarningIcon from '@mui/icons-material/Warning';

const Recommendations = ({ initialRecommendations = [] }) => {
    const [recommendations, setRecommendations] = useState(initialRecommendations);
    const [loading, setLoading] = useState(initialRecommendations.length === 0);
    const [error, setError] = useState(null);


    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost') + '/recommendations';

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
                <Typography level="title-lg" startDecorator={<ScienceIcon />}>
                    Recommended Next Steps
                </Typography>
                <Divider sx={{ my: 2 }} />
                {recommendations.length === 0 ? (
                    <Typography level="body-md">No recommendations available.</Typography>
                ) : (
                    <List>
                        {recommendations.map((rec) => (
                            <ListItem key={rec.id || `rec-${rec.title}`}>
                                <ListItemDecorator>
                                    {rec.type === 'Specialist' ? <MedicalServicesIcon /> : <ScienceIcon />}
                                </ListItemDecorator>
                                <ListItemContent>
                                    <Typography level="title-sm">{rec.title}</Typography>
                                    <Typography level="body-sm">Urgency: {rec.urgency}</Typography>
                                </ListItemContent>
                                <Button size="sm" variant="soft">Schedule</Button>
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default Recommendations;