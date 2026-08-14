import React, {forwardRef, ImgHTMLAttributes, useEffect, useRef, useState} from 'react';
import {ArrowPathIcon} from '@heroicons/react/24/outline';

interface ImageWithLoaderProps extends ImgHTMLAttributes<HTMLImageElement> {
    containerClassName?: string;
}

const ImageWithLoader = forwardRef<HTMLImageElement, ImageWithLoaderProps>(({
    containerClassName = '',
    onError,
    onLoad,
    src,
    ...props
}, forwardedRef) => {
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [loading, setLoading] = useState(Boolean(src));

    useEffect(() => {
        const image = imageRef.current;
        setLoading(Boolean(src) && !(image?.complete && image.naturalWidth > 0));
    }, [src]);

    const assignRef = (image: HTMLImageElement | null) => {
        imageRef.current = image;
        if (typeof forwardedRef === 'function') forwardedRef(image);
        else if (forwardedRef) forwardedRef.current = image;
    };

    return (
        <span className={`image-loader-frame ${containerClassName}`} aria-busy={loading}>
            {loading && (
                <span className="image-loading-indicator" aria-hidden="true">
                    <span className="image-loading-spinner"><ArrowPathIcon className="h-5 w-5 animate-spin"/></span>
                </span>
            )}
            <img
                {...props}
                ref={assignRef}
                src={src}
                className={`${props.className ?? ''} ${loading ? 'invisible' : ''}`}
                onLoad={event => {
                    setLoading(false);
                    onLoad?.(event);
                }}
                onError={event => {
                    setLoading(false);
                    onError?.(event);
                }}
            />
        </span>
    );
});

ImageWithLoader.displayName = 'ImageWithLoader';

export default ImageWithLoader;
