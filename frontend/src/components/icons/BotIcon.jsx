import React from 'react';
import { SvgIcon } from '@mui/material';

const BotIcon = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16.5c-3.31 0-6-2.69-6-6h2c0 2.21 1.79 4 4 4s4-1.79 4-4h2c0 3.31-2.69 6-6 6zm0-11c-1.38 0-2.5 1.12-2.5 2.5S10.62 12.5 12 12.5s2.5-1.12 2.5-2.5S13.38 7.5 12 7.5zM8 10.5H6v-2h2v2zm10 0h-2v-2h2v2z" />
    </SvgIcon>
  );
};

export default BotIcon; 