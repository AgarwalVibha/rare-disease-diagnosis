import React, { useState, useEffect } from 'react';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Divider from '@mui/joy/Divider';
import Table from '@mui/joy/Table';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CircularProgress from '@mui/joy/CircularProgress';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import WarningIcon from '@mui/icons-material/Warning';

const DiagnosisDisplay = ({ sx }) => {
    const [diagnoses, setDiagnoses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    <Table aria-label="Potential diagnoses">
                        <thead>
                            <tr>
                                <th>Condition</th>
                                <th>Probability</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {diagnoses.map((diagnosis) => (
                                <tr key={diagnosis.id}>
                                    <td>{diagnosis.name}</td>
                                    <td>{diagnosis.probability}</td>
                                    <td>{diagnosis.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Box>
            )}
        </Card>
    );
};

export default DiagnosisDisplay;