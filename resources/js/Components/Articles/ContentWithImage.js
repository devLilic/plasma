"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var ContentWithImage = function (_a) {
    var wallpaper = _a.wallpaper, removeWallpaper = _a.removeWallpaper;
    return (react_1.default.createElement("div", { className: 'relative' },
        react_1.default.createElement("img", { src: wallpaper, className: 'w-full' }),
        react_1.default.createElement("button", { className: 'absolute right-1 bottom-1 text-xs text-white border border-transparent hover:border-white hover:bg-red-800 rounded px-1 py-1', onClick: removeWallpaper }, "Remove image")));
};
exports.default = ContentWithImage;
//# sourceMappingURL=ContentWithImage.js.map