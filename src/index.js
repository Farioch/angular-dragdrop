import angular from 'angular';

import uiDraggable from './uiDraggable.directive';
import uiDroppable from './uiDroppable.directive';
import DragImageService from './dragImage.service';

function isDnDsSupported() {
    return 'ondrag' in document.createElement('a');
}

const module = angular.module('angular-dragdrop', []);

if (isDnDsSupported()) {
    module.directive('uiDraggable', uiDraggable);
    module.directive('uiDroppable', uiDroppable);
    module.service('dragImageService', DragImageService);
}

export default module.name;