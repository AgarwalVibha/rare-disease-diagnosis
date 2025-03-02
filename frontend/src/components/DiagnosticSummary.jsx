import React from 'react';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import Box from '@mui/joy/Box';
import Divider from '@mui/joy/Divider';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Grid from '@mui/joy/Grid';
import Chip from '@mui/joy/Chip';

const DiagnosticSummary = ({ diagnoses = [] }) => {
    // Check if we have actual diagnoses data
    const hasDiagnoses = Array.isArray(diagnoses) && diagnoses.length > 0;
    const topDiagnosis = hasDiagnoses ? diagnoses[0] : null;

    return (
        <Card variant="outlined" sx={{ height: '100%' }}>
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
            }}>
                <AssessmentIcon />
                <Typography level="title-md">Diagnostic Summary</Typography>
            </Box>

            <Divider />

            {!hasDiagnoses ? (
                <Box sx={{
                    p: 4,
                    bgcolor: 'background.level1',
                    borderRadius: 'sm',
                    mx: 2,
                    my: 2,
                    textAlign: 'center',
                    color: 'text.secondary'
                }}>
                    <Typography level="body-md" sx={{ fontStyle: 'italic' }}>
                        We need more information to generate a diagnostic summary. Please describe your symptoms in the chat, upload medical records, or add any known HPO codes.
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ p: 3 }}>
                    {/* Primary diagnostic summary */}
                    <Box sx={{ mb: 3 }}>
                        <Typography level="body-md" sx={{ mb: 2 }}>
                            Based on the provided information, we've identified {diagnoses.length} potential rare disease diagnoses that match your symptoms and clinical presentation.
                        </Typography>

                        <Typography level="body-md">
                            The most likely diagnosis is <strong>{topDiagnosis.name}</strong> with a {topDiagnosis.probability} probability match to your reported symptoms.
                            {topDiagnosis.details && ` ${topDiagnosis.name} is ${topDiagnosis.details}.`}
                        </Typography>
                    </Box>

                    {/* Additional diagnostic information in a grid */}
                    {(topDiagnosis.symptoms || topDiagnosis.inheritance || topDiagnosis.prevalence) && (
                        <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
                            {topDiagnosis.symptoms && (
                                <Grid xs={12} sm={6}>
                                    <Box sx={{ bgcolor: 'background.level1', p: 2, borderRadius: 'sm', height: '100%' }}>
                                        <Typography level="title-sm" sx={{ mb: 1 }}>Key Symptoms</Typography>
                                        <Typography level="body-sm">{topDiagnosis.symptoms}</Typography>
                                    </Box>
                                </Grid>
                            )}

                            <Grid xs={12} sm={6}>
                                <Box sx={{ bgcolor: 'background.level1', p: 2, borderRadius: 'sm', height: '100%' }}>
                                    <Typography level="title-sm" sx={{ mb: 1 }}>Disease Characteristics</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {topDiagnosis.inheritance && (
                                            <Typography level="body-sm">
                                                <strong>Inheritance:</strong> {topDiagnosis.inheritance}
                                            </Typography>
                                        )}
                                        {topDiagnosis.prevalence && (
                                            <Typography level="body-sm">
                                                <strong>Prevalence:</strong> {topDiagnosis.prevalence}
                                            </Typography>
                                        )}
                                        {topDiagnosis.orpha_code && (
                                            <Typography level="body-sm">
                                                <strong>Reference:</strong> {topDiagnosis.orpha_code}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    )}

                    {/* Important notes section */}
                    <Box sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'warning.softBg',
                        bgcolor: 'warning.softBg',
                        borderRadius: 'sm',
                        mt: 2
                    }}>
                        <Typography level="title-sm" sx={{ mb: 1, color: 'warning.solidBg' }}>
                            Important Notes
                        </Typography>
                        <Box component="ul" sx={{ pl: 3, mt: 0, mb: 0 }}>
                            <Typography component="li" level="body-sm">
                                These are preliminary results and should be confirmed by specialists
                            </Typography>
                            <Typography component="li" level="body-sm">
                                Follow the recommended next steps to reach a conclusive diagnosis
                            </Typography>
                            <Typography component="li" level="body-sm">
                                Additional testing may be required based on specialist consultations
                            </Typography>
                        </Box>
                    </Box>

                    {/* Differential diagnoses chips */}
                    {diagnoses.length > 1 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography level="title-sm" sx={{ mb: 1 }}>
                                Other Possible Diagnoses
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {diagnoses.slice(1, 4).map((diagnosis) => (
                                    <Chip
                                        key={diagnosis.id}
                                        variant="soft"
                                        color="neutral"
                                    >
                                        {diagnosis.name} ({diagnosis.probability})
                                    </Chip>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            )}
        </Card>
    );
};

export default DiagnosticSummary;