import React, { useState } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';

// Import individual components directly from their packages
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import Drawer from '@mui/joy/Drawer';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import IconButton from '@mui/joy/IconButton';
import Divider from '@mui/joy/Divider';

// Import icons
import InputIcon from '@mui/icons-material/Input';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MenuIcon from '@mui/icons-material/Menu';
import HistoryIcon from '@mui/icons-material/History';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import ImageIcon from '@mui/icons-material/Image';
import BiotechIcon from '@mui/icons-material/Biotech';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';

// Import pages
import InputsPage from './pages/InputsPage';
import ResultsPage from './pages/ResultsPage';

// Placeholder component for the new pages
const PlaceholderPage = ({ title }) => (
  <Box sx={{ p: 3 }}>
    <Typography level="h2" sx={{ mb: 2 }}>{title}</Typography>
    <Typography>This page is a placeholder for the {title} section in the demo.</Typography>
  </Box>
);

function App() {
  // State to track active page
  const [activePage, setActivePage] = useState('inputs');

  // State to control drawer open/close on mobile
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Handle page navigation
  const handleNavigation = (page) => {
    setActivePage(page);
    setDrawerOpen(false); // Close drawer after navigation on mobile
  };

  // Navigation items with icons and page references
  const navigationItems = [
    { id: 'background', label: 'Background', icon: <HistoryIcon /> },
    { id: 'inputs', label: 'Symptoms', icon: <InputIcon /> },
    { id: 'family', label: 'Family History', icon: <FamilyRestroomIcon /> },
    { id: 'biometrics', label: 'Biometrics', icon: <MonitorWeightIcon /> },
    { id: 'imaging', label: 'Imaging', icon: <ImageIcon /> },
    { id: 'genetic', label: 'Genetic Testing', icon: <BiotechIcon /> },
    { id: 'assessment', label: 'Assessment', icon: <AssessmentIcon /> },
  ];

  // Drawer content component
  const DrawerContent = () => (
    <Box sx={{ width: 240, p: 2 }}>
      <Typography level="h4" sx={{ mb: 2 }}>
        Welcome, Alex!
      </Typography>
      <Divider sx={{ my: 2 }} />
      <List size="lg" sx={{ '--ListItem-radius': '8px' }}>
        {navigationItems.map((item) => (
          <ListItem key={item.id}>
            <ListItemButton
              selected={activePage === item.id}
              onClick={() => handleNavigation(item.id)}
              sx={{
                fontWeight: activePage === item.id ? 'bold' : 'normal',
                bgcolor: activePage === item.id ? 'primary.softBg' : 'transparent'
              }}
            >
              <ListItemDecorator>
                {item.icon}
              </ListItemDecorator>
              <ListItemContent>{item.label}</ListItemContent>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  // Render the appropriate page based on active page state
  const renderActivePage = () => {
    switch (activePage) {
      case 'inputs':
        return <InputsPage />;
      case 'assessment':
        return <ResultsPage />; // Using the existing ResultsPage component but renamed to Assessment
      default:
        return <PlaceholderPage title={navigationItems.find(item => item.id === activePage)?.label} />;
    }
  };

  return (
    <CssVarsProvider>
      <CssBaseline />

      {/* App Container */}
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* App Bar */}
        <Sheet
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Menu Button (visible on mobile) */}
          <IconButton
            variant="outlined"
            color="neutral"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography level="h3">RareMind – A smart system that remembers every detail of a patient's story.</Typography>
        </Sheet>

        {/* Main Content Area */}
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* Permanent Drawer (desktop) */}
          <Sheet
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexShrink: 0,
              width: 240,
              borderRight: '1px solid',
              borderColor: 'divider',
            }}
          >
            <DrawerContent />
          </Sheet>

          {/* Temporary Drawer (mobile) */}
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-content': {
                boxSizing: 'border-box',
              },
            }}
          >
            <DrawerContent />
          </Drawer>

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 2,
              overflow: 'auto',
            }}
          >
            {renderActivePage()}
          </Box>
        </Box>
      </Box>
    </CssVarsProvider>
  );
}

export default App;