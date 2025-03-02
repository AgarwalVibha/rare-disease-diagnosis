import React, { useState, useEffect } from 'react';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import Divider from '@mui/joy/Divider';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CircularProgress from '@mui/joy/CircularProgress';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import WarningIcon from '@mui/icons-material/Warning';
import Accordion from '@mui/joy/Accordion';
import AccordionDetails from '@mui/joy/AccordionDetails';
import AccordionSummary from '@mui/joy/AccordionSummary';
import Chip from '@mui/joy/Chip';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const DiagnosisDisplay = ({ sx }) => {
    const [diagnoses, setDiagnoses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedDiagnosis, setExpandedDiagnosis] = useState(null);

    // API URL that works both locally and in production
    const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost') + '/diagnoses';

    useEffect(() => {
        const fetchDiagnoses = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(API_URL);

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();
                setDiagnoses(data.diagnoses || []);
            } catch (err) {
                console.error('Error fetching diagnoses:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDiagnoses();

        // Set up polling to periodically check for updates
        const intervalId = setInterval(fetchDiagnoses, 30000); // Check every 30 seconds

        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    const handleAccordionChange = (diagnosisId) => {
        setExpandedDiagnosis(expandedDiagnosis === diagnosisId ? null : diagnosisId);
    };

    return (
        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...sx }}>
            <Typography level="title-md" startDecorator={<MedicalServicesIcon />} sx={{ mb: 2 }}>
                Potential Diagnoses
            </Typography>

            {isLoading && diagnoses.length === 0 ? (
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
                    Error loading diagnoses: {error}
                </Alert>
            ) : diagnoses.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center', flexGrow: 1 }}>
                    <Typography level="body-sm" sx={{ fontStyle: 'italic' }}>
                        We need more information to suggest potential diagnoses. Please upload your medical records, describe your symptoms in the chat, or add any known HPO codes.
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {diagnoses.map((diagnosis) => (
                        <Accordion
                            key={diagnosis.id}
                            expanded={expandedDiagnosis === diagnosis.id}
                            onChange={() => handleAccordionChange(diagnosis.id)}
                            sx={{ mb: 1 }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                id={`diagnosis-header-${diagnosis.id}`}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                    <Typography level="title-sm">{diagnosis.name}</Typography>
                                    <Chip
                                        variant="soft"
                                        color={
                                            parseInt(diagnosis.probability) > 75 ? "success" :
                                                parseInt(diagnosis.probability) > 50 ? "warning" :
                                                    "neutral"
                                        }
                                    >
                                        {diagnosis.probability}
                                    </Chip>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography level="body-sm" sx={{ mb: 1 }}>
                                    <strong>Description:</strong> {diagnosis.details}
                                </Typography>
                                <Typography level="body-sm" sx={{ mb: 1 }}>
                                    <strong>Common Symptoms:</strong> {diagnosis.symptoms}
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    <Box sx={{ minWidth: '45%' }}>
                                        <Typography level="body-xs">
                                            <strong>Orphanet Code:</strong> {diagnosis.orpha_code}
                                        </Typography>
                                        <Typography level="body-xs">
                                            <strong>Inheritance:</strong> {diagnosis.inheritance}
                                        </Typography>
                                        <Typography level="body-xs">
                                            <strong>Prevalence:</strong> {diagnosis.prevalence}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ minWidth: '45%' }}>
                                        <Typography level="body-xs">
                                            <strong>Specialist Referral:</strong> {diagnosis.specialist}
                                        </Typography>
                                        <Typography level="body-xs">
                                            <strong>Confirmatory Tests:</strong> {diagnosis.key_tests}
                                        </Typography>
                                    </Box>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}
        </Card>
    );
};

export default DiagnosisDisplay;