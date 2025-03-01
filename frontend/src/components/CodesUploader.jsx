import React, { useState } from 'react';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Textarea from '@mui/joy/Textarea';
import FormControl from '@mui/joy/FormControl';
import FormHelperText from '@mui/joy/FormHelperText';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import Chip from '@mui/joy/Chip';
import CircularProgress from '@mui/joy/CircularProgress';
import Add from '@mui/icons-material/Add';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';

// API URL based on Docker setup
const API_URL = 'http://localhost/hpo-codes';

const CodesUploader = ({ sx }) => {
    const [codesInput, setCodesInput] = useState('');
    const [parsedCodes, setParsedCodes] = useState([]);
    const [isParsingMode, setIsParsingMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Parse the input text into HPO codes
    const parseHPOCodes = () => {
        setError('');

        try {
            // Split by lines and filter out empty lines
            const lines = codesInput.trim().split('\n').filter(line => line.trim() !== '');

            if (lines.length === 0) {
                setError('Please enter at least one HPO code');
                return;
            }

            const codes = lines.map(line => {
                // Try to extract just the HPO ID from the line
                // We're looking for HP:nnnnnnn format
                const hpoIdMatch = line.match(/HP:\d+/);

                if (!hpoIdMatch) {
                    throw new Error(`Invalid format in line: "${line}". Expected format containing "HP:0000123"`);
                }

                return {
                    id: hpoIdMatch[0],
                    name: "To be looked up by backend", // Placeholder - will be filled by backend
                    source: 'Manual entry'
                };
            });

            setParsedCodes(codes);
            setIsParsingMode(false);
        } catch (err) {
            setError(err.message);
        }
    };

    // Reset to input mode
    const handleEditAgain = () => {
        setIsParsingMode(true);
        setSuccess(false);
    };

    // Submit codes to API
    const handleSubmitCodes = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parsedCodes),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            setSuccess(true);

            // Clear the form after successful submission
            setTimeout(() => {
                setCodesInput('');
                setParsedCodes([]);
                setIsParsingMode(true);
                setSuccess(false);
            }, 2000);

        } catch (err) {
            setError(err.message || 'Failed to submit HPO codes');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...sx }}>
            <Typography level="title-md" sx={{ mb: 2 }}>
                Add HPO Codes
            </Typography>

            {success ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
                    <CheckCircleOutline sx={{ color: 'success.500', fontSize: 48, mb: 2 }} />
                    <Typography level="body-md">Codes added successfully!</Typography>
                </Box>
            ) : isParsingMode ? (
                <>
                    <FormControl error={!!error} sx={{ mb: 2 }}>
                        <Textarea
                            placeholder="Enter HPO codes (one per line)&#10;Example:&#10;HP:0001382&#10;HP:0002829"
                            minRows={5}
                            value={codesInput}
                            onChange={(e) => setCodesInput(e.target.value)}
                            sx={{ flexGrow: 1 }}
                        />
                        {error && <FormHelperText>{error}</FormHelperText>}
                    </FormControl>

                    <Button
                        variant="solid"
                        color="primary"
                        onClick={parseHPOCodes}
                        disabled={!codesInput.trim() || isLoading}
                        startDecorator={isLoading ? <CircularProgress size="sm" /> : <Add />}
                    >
                        Parse Codes
                    </Button>
                </>
            ) : (
                <>
                    <Sheet
                        variant="soft"
                        sx={{
                            p: 2,
                            borderRadius: 'sm',
                            mb: 2,
                            overflow: 'auto',
                            flexGrow: 1
                        }}
                    >
                        <Typography level="body-sm" sx={{ mb: 1 }}>
                            {parsedCodes.length} code{parsedCodes.length !== 1 ? 's' : ''} found:
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {parsedCodes.map((code) => (
                                <Chip key={code.id} size="sm" variant="soft" color="primary">
                                    {code.id}
                                </Chip>
                            ))}
                        </Box>
                    </Sheet>

                    {error && (
                        <Typography level="body-sm" color="danger" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                        <Button
                            variant="outlined"
                            color="neutral"
                            onClick={handleEditAgain}
                            disabled={isLoading}
                            sx={{ flexGrow: 1 }}
                        >
                            Edit Again
                        </Button>
                        <Button
                            variant="solid"
                            color="primary"
                            onClick={handleSubmitCodes}
                            disabled={isLoading || parsedCodes.length === 0}
                            startDecorator={isLoading ? <CircularProgress size="sm" /> : null}
                            sx={{ flexGrow: 1 }}
                        >
                            {isLoading ? 'Submitting...' : 'Submit Codes'}
                        </Button>
                    </Box>
                </>
            )}
        </Card>
    );
};

export default CodesUploader;