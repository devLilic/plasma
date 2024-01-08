"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var articles_context_1 = require("@/Store/ArticleStore/articles-context");
var ImageEditorDialog_1 = require("@/Shared/Dialogs/ImageEditorDialog");
var react_2 = require("@material-tailwind/react");
var images_context_1 = require("@/Store/ImagesStore/images-context");
var file_saver_1 = require("file-saver");
var NewArticleDialog_1 = require("@/Shared/Dialogs/NewArticleDialog");
var Article_1 = require("@/Components/Articles/Article");
var ArticlesList = function () {
    var articlesCtx = (0, react_1.useContext)(articles_context_1.default);
    var imagesCtx = (0, react_1.useContext)(images_context_1.default);
    var _a = (0, react_1.useState)(false), editorDialogOpen = _a[0], setEditorDialogOpen = _a[1];
    var _b = (0, react_1.useState)(false), newArticleDialogOpen = _b[0], setNewArticleDialogOpen = _b[1];
    var handleEditorDialog = function () {
        setEditorDialogOpen(function (prevState) { return !prevState; });
    };
    var handleNewArticleDialog = function (article_id) {
        if (article_id === void 0) { article_id = null; }
        if (article_id) {
            articlesCtx.setArticleToEdit(article_id);
            console.log('new article ', article_id);
        }
        setNewArticleDialogOpen(function (prevState) { return !prevState; });
    };
    var saveImages = function () {
        var counter = 1;
        articlesCtx.articles.map(function (article) {
            if (article.images.wallpaper) {
                (0, file_saver_1.default)("".concat(article.images.wallpaper), "".concat(counter, "_").concat(article.slug, ".jpg"));
            }
            counter++;
        });
    };
    var addNewArticle = function (title, type) {
        articlesCtx.addNewArticle(title, type, articlesCtx.articleToEdit);
    };
    return (react_1.default.createElement("div", { className: "shadow-sm sm:rounded-lg" },
        react_1.default.createElement("div", { className: 'grid grid-cols-4 gap-x-5' }, articlesCtx.articles && (articlesCtx.articles.map(function (article) {
            return react_1.default.createElement(Article_1.default, { key: article.id, article: article, handleEditorDialog: handleEditorDialog, handleNewArticleDialog: handleNewArticleDialog, loading: imagesCtx.external.selected.loading });
        }))),
        react_1.default.createElement("div", { className: 'text-center my-2' },
            react_1.default.createElement(react_2.Button, { className: "mb-3", onClick: saveImages }, "Save")),
        react_1.default.createElement(ImageEditorDialog_1.default, { dialogOpen: editorDialogOpen, handleDialog: handleEditorDialog }),
        react_1.default.createElement(NewArticleDialog_1.default, { dialogOpen: newArticleDialogOpen, handleDialog: handleNewArticleDialog, saveArticle: addNewArticle })));
};
exports.default = ArticlesList;
//# sourceMappingURL=ArticlesList.js.map