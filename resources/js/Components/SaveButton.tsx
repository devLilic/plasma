import React, {ReactNode} from 'react';
import {Article} from "@/types";
import {colors} from "@material-tailwind/react/types/generic";
import Button from "@/Components/Material/Button";
import {imageFilename, saveImageAs} from '@/Utils/imageDownload';

interface SaveButtonProps {
    articles: Article[]
    color?: colors
    className?: string
    children?: ReactNode
}


const SaveButton = ({articles, color="blue", className, children}: SaveButtonProps) => {

    const saveImages = () => {
        articles.forEach(article => {
            if (article.image) {
                const title = article.subtitle?.trim() || article.title?.trim() || 'articol';
                const filename = imageFilename(`${article.playlist_order}_${title}`);
                saveImageAs(article.image.url, filename);
            }
        });
    };
    return (
        <Button className={`ios-primary-button ${className ?? ''}`}
                color={color}
                onClick={saveImages}
        >{children ?? 'Descarcă'}</Button>
    );
};

export default SaveButton;
