import React from 'react';

type LoadingProps = {
    color?: string
}

const Loading = ({color = "#009ef7"}:LoadingProps) => {

    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="m-auto bg-none block w-10 h-10"
             style={{shapeRendering: 'auto'}}
             viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
            <rect x="19" y="19" width="20" height="20" fill={color}>
                <animate attributeName="fill" values={`#ffffff;${color};${color}`} keyTimes="0;0.125;1"
                         dur="0.53475935828877s" repeatCount="indefinite" begin="0s" calcMode="discrete"></animate>
            </rect>
            <rect x="40" y="19" width="20" height="20" fill={color}>
                <animate attributeName="fill" values={`#ffffff;${color};${color}`} keyTimes="0;0.125;1"
                         dur="0.53475935828877s" repeatCount="indefinite" begin="0.06684491978609625s"
                         calcMode="discrete"></animate>
            </rect>
            <rect x="61" y="19" width="20" height="20" fill={color}>
                <animate attributeName="fill" values={`#ffffff;${color};${color}`} keyTimes="0;0.125;1"
                         dur="0.53475935828877s" repeatCount="indefinite" begin="0.1336898395721925s"
                         calcMode="discrete"></animate>
            </rect>
            <rect x="19" y="40" width="20" height="20" fill={color}>
                <animate attributeName="fill" values={`#ffffff;${color};${color}`} keyTimes="0;0.125;1"
                         dur="0.53475935828877s" repeatCount="indefinite" begin="0.4679144385026738s"
                         calcMode="discrete"></animate>
            </rect>
            <rect x="61" y="40" width="20" height="20" fill={color}>
                <animate attributeName="fill" values={`#ffffff;${color};${color}`} keyTimes="0;0.125;1"
                         dur="0.53475935828877s" repeatCount="indefinite" begin="0.20053475935828877s"
                         calcMode="discrete"></animate>
            </rect>
            <rect x="19" y="61" width="20" height="20" fill={color}>
                <animate attributeName="fill" values={`#ffffff;${color};${color}`} keyTimes="0;0.125;1"
                         dur="0.53475935828877s" repeatCount="indefinite" begin="0.40106951871657753s"
                         calcMode="discrete"></animate>
            </rect>
            <rect x="40" y="61" width="20" height="20" fill={color}>
                <animate attributeName="fill" values={`#ffffff;${color};${color}`} keyTimes="0;0.125;1"
                         dur="0.53475935828877s" repeatCount="indefinite" begin="0.3342245989304813s"
                         calcMode="discrete"></animate>
            </rect>
            <rect x="61" y="61" width="20" height="20" fill={color}>
                <animate attributeName="fill" values={`#ffffff;${color};${color}`} keyTimes="0;0.125;1"
                         dur="0.53475935828877s" repeatCount="indefinite" begin="0.267379679144385s"
                         calcMode="discrete"></animate>
            </rect>
        </svg>
    );
};

export default Loading;
