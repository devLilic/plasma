import React, {ReactNode} from 'react';
import {saveAs} from "file-saver";
import {Article} from "@/types";
import {colors} from "@material-tailwind/react/types/generic";
import Button from "@/Components/Material/Button";

interface SaveButtonProps {
    articles: Article[]
    color?: colors
    className?: string
    children?: ReactNode
}


const SaveButton = ({articles, color="blue", className, children}: SaveButtonProps) => {

    const saveImages = () => {
        let counter = 1;
        articles.map(article => {
            if (article.image) {
                saveAs(`${article.image.url}`, `${counter}_${article.subtitle}.jpg`)
            }
            counter++
        })
    }
    return (
        <Button className={`ios-primary-button ${className ?? ''}`}
                color={color}
                onClick={saveImages}
        >{children ?? 'Descarcă'}</Button>
    );
};

export default SaveButton;
