import angular from 'angular';

function determineEffectAllowed(e) {
    if(e.originalEvent) {
      e.dataTransfer = e.originalEvent.dataTransfer;
    }

    // Chrome doesn't set dropEffect, so we have to work it out ourselves
    if (typeof e.dataTransfer !== 'undefined' && e.dataTransfer.dropEffect === 'none') {
        if (e.dataTransfer.effectAllowed === 'copy' ||
            e.dataTransfer.effectAllowed === 'move') {
            e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed;
        } else if (e.dataTransfer.effectAllowed === 'copyMove' || e.dataTransfer.effectAllowed === 'copymove') {
            e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
        }
    }
}

uiDraggableDirective.$inject = ['$parse', '$rootScope', 'dragImageService'];
function uiDraggableDirective($parse, $rootScope, $dragImage) {
    return function(scope, element, attrs) {
        var isDragHandleUsed = false,
            dragHandleClass,
            draggingClass = attrs.draggingClass || 'on-dragging',
            dragTarget;

        element.attr('draggable', false);

        scope.$watch(attrs.uiDraggable, function(newValue) {
            if (newValue) {
                element.attr('draggable', newValue);
                element.bind('dragend', dragendHandler);
                element.bind('dragstart', dragstartHandler);
            }
            else {
                element.removeAttr('draggable');
                element.unbind('dragend', dragendHandler);
                element.unbind('dragstart', dragstartHandler);
            }

        });

        if (angular.isString(attrs.dragHandleClass)) {
            isDragHandleUsed = true;
            dragHandleClass = attrs.dragHandleClass.trim() || 'drag-handle';

            element.bind('mousedown', function(e) {
                dragTarget = e.target;
            });
        }

        function dragendHandler(e) {
            if(e.originalEvent) {
              e.dataTransfer = e.originalEvent.dataTransfer;
            }

            setTimeout(function() {
                element.unbind('$destroy', dragendHandler);
            }, 0);
            var sendChannel = attrs.dragChannel || 'defaultchannel';
            $rootScope.$broadcast('ANGULAR_DRAG_END', e, sendChannel);

            determineEffectAllowed(e);

            if (e.dataTransfer && e.dataTransfer.dropEffect !== 'none') {
                if (attrs.onDropSuccess) {
                    var onDropSuccessFn = $parse(attrs.onDropSuccess);
                    scope.$evalAsync(function() {
                        onDropSuccessFn(scope, {$event: e});
                    });
                }
            }else if (e.dataTransfer && e.dataTransfer.dropEffect === 'none'){
                if (attrs.onDropFailure) {
                    var onDropFailureFn = $parse(attrs.onDropFailure);
                    scope.$evalAsync(function() {
                        onDropFailureFn(scope, {$event: e});
                    });
                }
            }
            element.removeClass(draggingClass);
        }

        function setDragElement(e, dragImageElementId) {
            var dragImageElementFn;

            if(e.originalEvent) {
              e.dataTransfer = e.originalEvent.dataTransfer;
            }

            dragImageElementFn = $parse(dragImageElementId);

            scope.$apply(function() {
                var elementId = dragImageElementFn(scope, {$event: e}),
                    dragElement;

                if (!(elementId && angular.isString(elementId))) {
                    return;
                }

                dragElement = document.getElementById(elementId);

                if (!dragElement) {
                    return;
                }

                e.dataTransfer.setDragImage(dragElement, 0, 0);
            });
        }

        function dragstartHandler(e) {
            if(e.originalEvent) {
              e.dataTransfer = e.originalEvent.dataTransfer;
            }

            var isDragAllowed = !isDragHandleUsed || dragTarget.classList.contains(dragHandleClass);

            if (isDragAllowed) {
                var sendChannel = attrs.dragChannel || 'defaultchannel';
                var dragData = '';
                if (attrs.drag) {
                    dragData = scope.$eval(attrs.drag);
                }

                var dragImage = attrs.dragImage || null;

                element.addClass(draggingClass);
                element.bind('$destroy', dragendHandler);

                //Code to make sure that the setDragImage is available. IE 10, 11, and Opera do not support setDragImage.
                var hasNativeDraggable = !(document.uniqueID || window.opera);

                //If there is a draggable image passed in, then set the image to be dragged.
                if (dragImage && hasNativeDraggable) {
                    var dragImageFn = $parse(attrs.dragImage);
                    scope.$apply(function() {
                        var dragImageParameters = dragImageFn(scope, {$event: e});
                        if (dragImageParameters) {
                            if (angular.isString(dragImageParameters)) {
                                dragImageParameters = $dragImage.generate(dragImageParameters);
                            }
                            if (dragImageParameters.image) {
                                var xOffset = dragImageParameters.xOffset || 0,
                                    yOffset = dragImageParameters.yOffset || 0;
                                e.dataTransfer.setDragImage(dragImageParameters.image, xOffset, yOffset);
                            }
                        }
                    });
                } else if (attrs.dragImageElementId) {
                    setDragElement(e, attrs.dragImageElementId);
                }

                var offset = {x: e.offsetX, y: e.offsetY};
                var transferDataObject = {data: dragData, channel: sendChannel, offset: offset};
                var transferDataText = angular.toJson(transferDataObject);

                e.dataTransfer.setData('text', transferDataText);
                e.dataTransfer.effectAllowed = 'copyMove';
                
                
                if (attrs.onDragStart) {
                    var onDragStartFn = $parse(attrs.onDragStart);
                    scope.$evalAsync(function () {
                        onDragStartFn(scope, {
                            $event: e
                        });
                    });
                }

                $rootScope.$broadcast('ANGULAR_DRAG_START', e, sendChannel, transferDataObject);
            }
            else {
                e.preventDefault();
            }
        }
    };
}

export default uiDraggableDirective;