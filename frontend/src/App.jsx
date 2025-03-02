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

// Import pages
import InputsPage from './pages/InputsPage';
import ResultsPage from './pages/ResultsPage';

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

  // Drawer content component
  const DrawerContent = () => (
    <Box sx={{ width: 240, p: 2 }}>
      <Typography level="h4" sx={{ mb: 2 }}>
        Welcome, Alex!
      </Typography>
      <Divider sx={{ my: 2 }} />
      <List size="lg" sx={{ '--ListItem-radius': '8px' }}>
        <ListItem>
          <ListItemButton
            selected={activePage === 'inputs'}
            onClick={() => handleNavigation('inputs')}
            sx={{
              fontWeight: activePage === 'inputs' ? 'bold' : 'normal',
              bgcolor: activePage === 'inputs' ? 'primary.softBg' : 'transparent'
            }}
          >
            <ListItemDecorator>
              <InputIcon />
            </ListItemDecorator>
            <ListItemContent>History</ListItemContent>
          </ListItemButton>
        </ListItem>
        <ListItem>
          <ListItemButton
            selected={activePage === 'results'}
            onClick={() => handleNavigation('results')}
            sx={{
              fontWeight: activePage === 'results' ? 'bold' : 'normal',
              bgcolor: activePage === 'results' ? 'primary.softBg' : 'transparent'
            }}
          >
            <ListItemDecorator>
              <AssessmentIcon />
            </ListItemDecorator>
            <ListItemContent>Guidance</ListItemContent>
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

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

          <Typography level="h3">MyRareDx - A rare disease diagnosis dashboard</Typography>
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
            {activePage === 'inputs' ? (
              <InputsPage />
            ) : (
              <ResultsPage />
            )}
          </Box>
        </Box>
      </Box>
    </CssVarsProvider>
  );
}

export default App;