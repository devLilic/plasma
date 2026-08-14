import React from 'react';

type ApplicationLogoProps = {
    className?: string
}

const ApplicationLogo = ({className = ''}: ApplicationLogoProps) => (
    <span className={`plasma-logo ${className}`} aria-hidden="true">
        <span className="plasma-logo__orbit"/>
        <span className="plasma-logo__drop"/>
    </span>
);

export default ApplicationLogo;
