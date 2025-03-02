import React, { useState, useEffect } from 'react';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import Chip from '@mui/joy/Chip';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import CircularProgress from '@mui/joy/CircularProgress';
import Alert from '@mui/joy/Alert';
import Divider from '@mui/joy/Divider';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningIcon from '@mui/icons-material/Warning';

const HPOCodesPanel = ({ sx }) => {
    const [hpoCodes, setHpoCodes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // API URL based on Docker setup
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost') + '/hpo-codes';

    // Fetch HPO codes on component mount
    useEffect(() => {
        const fetchHPOCodes = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(API_URL);

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();
                setHpoCodes(data.codes || []);
            } catch (err) {
                console.error('Error fetching HPO codes:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHPOCodes();

        // Set up polling to periodically check for updates
        const intervalId = setInterval(fetchHPOCodes, 30000); // Check every 30 seconds

        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    return (
        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...sx }}>
            <Typography level="title-md" sx={{ mb: 2 }}>
                Your Medical Profile
            </Typography>

            {isLoading && hpoCodes.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                    <CircularProgress size="md" />
                </Box>
            ) : error ? (
                <Alert
                    variant="soft"
                    color="danger"
                    startDecorator={<WarningIcon />}
                    sx={{ mb: 2 }}
                >
                    Error loading medical terms: {error}
                </Alert>
            ) : hpoCodes.length === 0 ? (
                <Sheet
                    variant="soft"
                    color="neutral"
                    sx={{
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexGrow: 1,
                        borderRadius: 'sm'
                    }}
                >
                    <Typography level="body-sm" sx={{ fontStyle: 'italic' }}>
                        No medical terms have been identified yet. Try uploading clinical notes or describing symptoms in the chat.
                    </Typography>
                </Sheet>
            ) : (
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <List>
                        {hpoCodes.map((code) => (
                            <ListItem key={code.id}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography level="body-md">{code.name}</Typography>
                                        <Chip
                                            size="sm"
                                            variant="soft"
                                            color="primary"
                                            slotProps={{ action: { component: 'a', href: `https://hpo.jax.org/app/browse/term/${code.id}`, target: '_blank' } }}
                                        >
                                            {code.id}
                                        </Chip>
                                    </Box>
                                    {code.source && (
                                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                            Source: {code.source}
                                        </Typography>
                                    )}
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ p: 1, bgcolor: 'background.level1', borderRadius: 'sm' }}>
                <Typography
                    level="body-xs"
                    startDecorator={<InfoOutlinedIcon fontSize="small" />}
                    sx={{ color: 'text.secondary' }}
                >
                    These are Human Phenotype Ontology (HPO) terms - standardized medical descriptions that help us identify potential rare disease diagnoses. The more information you provide, the more accurate our analysis can be.
                </Typography>
            </Box>
        </Card>
    );
};

export default HPOCodesPanel;