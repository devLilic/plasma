"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@material-tailwind/react");
var Label_1 = require("@/Components/UI/FormElements/Label");
var Card_1 = require("@/Components/UI/Card");
var articles_context_1 = require("@/Store/ArticleStore/articles-context");
var Checkbox_1 = require("@/Components/UI/FormElements/Checkbox");
var Loading_1 = require("@/Components/UI/Svg/Loading");
var ArticleHeader_1 = require("@/Components/Articles/ArticleHeader");
var ArticleFooter_1 = require("@/Components/Articles/ArticleFooter");
var ContentWithImage_1 = require("@/Components/Articles/ContentWithImage");
var ArticleItem = function (_a) {
    var article = _a.article, handleEditorDialog = _a.handleEditorDialog, handleNewArticleDialog = _a.handleNewArticleDialog, loading = _a.loading;
    var articlesCtx = (0, react_1.useContext)(articles_context_1.default);
    var editSearchOption = function (search_type) {
        articlesCtx.editSearch(article.id, search_type);
    };
    var editArticle = function () {
        articlesCtx.setArticleToEdit(article.id);
        handleEditorDialog();
    };
    var removeWallpaper = function () {
        articlesCtx.removeWallpaper(article.id);
    };
    var showIntro = function () {
        articlesCtx.showIntro(article.id);
    };
    var setCustomTitle = function (event) {
        articlesCtx.addCustomTitle(article.id, event.target.value);
    };
    return (react_1.default.createElement(Card_1.default, null,
        react_1.default.createElement(ArticleHeader_1.default, { type: article.type, addArticle: handleNewArticleDialog.bind(null, article.id), title: article.title }),
        (loading && article.id === articlesCtx.articleToEdit) ?
            (react_1.default.createElement("div", { className: 'h-32 flex justify-center' },
                react_1.default.createElement(Loading_1.default, null))) :
            (article.image ?
                (react_1.default.createElement(ContentWithImage_1.default, { wallpaper: article.image.url, removeWallpaper: removeWallpaper })) :
                react_1.default.createElement("div", { className: "text-blue-600" },
                    react_1.default.createElement(Label_1.default, { className: 'flex items-center py-1' },
                        react_1.default.createElement(Checkbox_1.default, { id: article.id + "_slug", isChecked: article.search_by === 'slug', onChange: editSearchOption.bind(null, 'slug') }),
                        react_1.default.createElement("span", null, article.slug)),
                    react_1.default.createElement(Label_1.default, { className: 'flex items-center mr-2' },
                        react_1.default.createElement(Checkbox_1.default, { id: article.id + "_title", isChecked: article.search_by === 'title', onChange: editSearchOption.bind(null, 'title') }),
                        react_1.default.createElement("div", null, article.title)),
                    react_1.default.createElement(Label_1.default, { className: 'flex justify-between items-center mt-2 mr-2 mb-5' },
                        react_1.default.createElement(Checkbox_1.default, { id: article.id + "_custom", isChecked: article.search_by === 'custom', onChange: editSearchOption.bind(null, 'custom') }),
                        react_1.default.createElement(react_2.Input, { label: 'Alte idei', value: article.custom, onChange: setCustomTitle })))),
        react_1.default.createElement(ArticleFooter_1.default, { showIntro: showIntro, editArticle: editArticle, isIntroDisplayed: article.isIntroDisplayed, content: article.intro, searchQuery: article.slug, handleDialog: handleEditorDialog })));
};
exports.default = ArticleItem;
//# sourceMappingURL=Article.js.map
