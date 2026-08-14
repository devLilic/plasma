import React, {InputHTMLAttributes} from 'react';
import InputError from '@/Components/InputError';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string
}

const AuthField = ({label, error, className = '', ...props}: AuthFieldProps) => (
    <label className="block">
        <span className="auth-field-label">{label}</span>
        <input {...props} className={`ios-search !pl-4 ${className}`}/>
        {error && <div className="mt-2"><InputError message={error}/></div>}
    </label>
);

export default AuthField;
