import angular from 'angular';

const dragImageConfig = {
    height: 20,
    width: 200,
    padding: 10,
    font: 'bold 11px Arial',
    fontColor: '#eee8d5',
    backgroundColor: '#93a1a1',
    xOffset: 0,
    yOffset: 0
};

function fitString(canvas, text, config) {
    var ELLIPSIS = '…';
    var width = canvas.measureText(text).width;
    if (width < config.width) {
        return text;
    }
    while (width + config.padding > config.width) {
        text = text.substring(0, text.length - 1);
        width = canvas.measureText(text + ELLIPSIS).width;
    }
    return text + ELLIPSIS;
}

class dragImageService {
    constructor() {}

    generate(text, options) {
        var config = angular.extend({}, defaultConfig, options || {});
        var el = document.createElement('canvas');

        el.height = config.height;
        el.width = config.width;

        var canvas = el.getContext('2d');

        canvas.fillStyle = config.backgroundColor;
        canvas.fillRect(0, 0, config.width, config.height);
        canvas.font = config.font;
        canvas.fillStyle = config.fontColor;

        var title = fitString(canvas, text, config);
        canvas.fillText(title, 4, config.padding + 4);

        var image = new Image();
        image.src = el.toDataURL();

        return {
            image: image,
            xOffset: config.xOffset,
            yOffset: config.yOffset
        };
    };
}

export default dragImageService;