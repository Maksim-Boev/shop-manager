'use client';

import * as React from 'react';
import TextField from '@mui/material/TextField';
import { UITextFieldProps } from './types';

export const UITextField = React.forwardRef<HTMLDivElement, UITextFieldProps>(
    (props, ref) => {
        return <TextField ref={ref} {...props} />;
    }
);

UITextField.displayName = 'UITextField';
