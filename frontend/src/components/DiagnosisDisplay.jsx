import React from 'react';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Divider from '@mui/joy/Divider';
import Table from '@mui/joy/Table';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

const DiagnosisDisplay = ({ diagnoses }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography level="title-lg" startDecorator={<MedicalServicesIcon />}>
                    Potential Diagnoses
                </Typography>
                <Divider sx={{ my: 2 }} />
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
            </CardContent>
        </Card>
    );
};

export default DiagnosisDisplay;