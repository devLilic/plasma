import React from 'react';
import {saveAs} from "file-saver";
import {Article} from "@/types";
import {colors} from "@material-tailwind/react/types/generic";
import Button from "@/Components/Material/Button";

interface SaveButtonProps {
    articles: Article[]
    color?: colors
    className?: string
}


const SaveButton = ({articles, color="green", className}: SaveButtonProps) => {

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
                onClick={saveImages}
        >Save</Button>
    );
};

export default SaveButton;
