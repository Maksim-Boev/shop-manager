'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import { UIButtonProps } from './types';

export const UIButton = React.forwardRef<HTMLButtonElement, UIButtonProps>(
    (props, ref) => {
        return <Button ref={ref} {...props} />;
    }
);

UIButton.displayName = 'UIButton';
