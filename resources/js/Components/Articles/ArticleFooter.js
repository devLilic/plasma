"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@material-tailwind/react");
var GoogleIcon_1 = require("../UI/Svg/GoogleIcon");
var SearchImageIcon_1 = require("../UI/Svg/SearchImageIcon");
var ArticleFooter = function (_a) {
    var showIntro = _a.showIntro, editArticle = _a.editArticle, isIntroDisplayed = _a.isIntroDisplayed, content = _a.content, searchQuery = _a.searchQuery;
    var makeLinkQuery = function (query) {
        return "https://www.google.com/search?q=".concat(query.split(' ').join('+'), "&source=lnms&tbm=isch");
    };
    var visitGoogle = function () {
        var url = makeLinkQuery(searchQuery);
        window.open(url, '_blank', 'noopener,noreferrer');
        editArticle();
    };
    return (react_1.default.createElement("div", { className: 'mb-3 px-2 flex flex-col items-center justify-center border-t border-blue-500 border-dashed pt-3' },
        react_1.default.createElement("div", { className: 'flex justify-between w-full' },
            react_1.default.createElement(react_2.Button, { variant: "outlined", size: "sm", onClick: showIntro }, "Intro"),
            react_1.default.createElement(react_2.Button, { variant: "outlined", onClick: visitGoogle },
                react_1.default.createElement(GoogleIcon_1.default, null)),
            react_1.default.createElement(react_2.Button, { variant: 'outlined', color: 'amber', size: 'sm', type: 'button', onClick: editArticle },
                react_1.default.createElement(SearchImageIcon_1.default, null))),
        isIntroDisplayed && react_1.default.createElement("p", { className: 'mt-1' }, content)));
};
exports.default = ArticleFooter;
//# sourceMappingURL=ArticleFooter.js.map