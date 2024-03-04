import React, {FC} from 'react';
import {saveAs} from "file-saver";
import {Article} from "@/types";
import {Button, ButtonProps} from "@material-tailwind/react";
import {colors} from "@material-tailwind/react/types/generic";

interface SaveButtonProps {
    articles: Article[]
    color?: colors
    className?: string
}


const SaveButton: FC<SaveButtonProps> = ({articles, color="red", className}: SaveButtonProps) => {

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
        <Button className={className}
                color={color}
                placeholder={null}
                onClick={saveImages}
        >Save</Button>
    );
};

export default SaveButton;
