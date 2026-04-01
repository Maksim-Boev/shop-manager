'use client';

import * as React from 'react';
import Typography from '@mui/material/Typography';
import { UITypographyProps } from './types';

export const UITypography = React.forwardRef<HTMLElement, UITypographyProps>(
    (props, ref) => {
        return <Typography ref={ref} {...props} />;
    }
);

UITypography.displayName = 'UITypography';
