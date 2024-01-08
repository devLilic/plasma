"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@material-tailwind/react");
var ArticleHeader = function (_a) {
    var title = _a.title, type = _a.type, addArticle = _a.addArticle;
    return (react_1.default.createElement("div", { className: 'px-3 py-2 text-sm font-bold bg-blue-500 text-white flex justify-between items-center' },
        react_1.default.createElement("div", { className: 'h-12 flex items-center' },
            title.toUpperCase(),
            " (",
            type,
            ")"),
        react_1.default.createElement(react_2.Button, { variant: "text", color: 'purple', title: "Add new article", size: 'sm', className: "ml-3 p-0", onClick: addArticle },
            react_1.default.createElement("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
                react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" })))));
};
exports.default = ArticleHeader;
//# sourceMappingURL=ArticleHeader.js.map