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

uiDroppableDirective.$inject = ['$parse', '$rootScope'];
function uiDroppableDirective($parse, $rootScope) {
    return function(scope, element, attr) {
        var dragging = 0; //Ref. http://stackoverflow.com/a/10906204
        var dropChannel = attr.dropChannel || 'defaultchannel';
        var dragChannel = '';
        var dragEnterClass = attr.dragEnterClass || 'on-drag-enter';
        var dragHoverClass = attr.dragHoverClass || 'on-drag-hover';
        var customDragEnterEvent = $parse(attr.onDragEnter);
        var customDragLeaveEvent = $parse(attr.onDragLeave);

        function calculateDropOffset(e) {
            var offset = {
                x: e.offsetX,
                y: e.offsetY
            };
            var target = e.target;

            while (target !== element[0]) {
                offset.x = offset.x + target.offsetLeft;
                offset.y = offset.y + target.offsetTop;

                target = target.offsetParent;
                if (!target) {
                    return null;
                }
            }

            return offset;
        }

        function onDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault(); // Necessary. Allows us to drop.
            }

            if (e.stopPropagation) {
                e.stopPropagation();
            }

            var uiOnDragOverFn = $parse(attr.uiOnDragOver);
            scope.$evalAsync(function() {
                uiOnDragOverFn(scope, {$event: e, $channel: dropChannel});
            });

            return false;
        }

        function onDragLeave(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }

            if (e.stopPropagation) {
                e.stopPropagation();
            }
            dragging--;

            if (dragging === 0) {
                scope.$evalAsync(function() {
                    customDragLeaveEvent(scope, {$event: e, $channel: dropChannel});
                });
                element.addClass(dragEnterClass);
                element.removeClass(dragHoverClass);
            }

            var uiOnDragLeaveFn = $parse(attr.uiOnDragLeave);
            scope.$evalAsync(function() {
                uiOnDragLeaveFn(scope, {$event: e, $channel: dropChannel});
            });
        }

        function onDragEnter(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }

            if (e.stopPropagation) {
                e.stopPropagation();
            }

            if (dragging === 0) {
                scope.$evalAsync(function() {
                    customDragEnterEvent(scope, {$event: e, $channel: dropChannel});
                });
                element.removeClass(dragEnterClass);
                element.addClass(dragHoverClass);
            }
            dragging++;

            var uiOnDragEnterFn = $parse(attr.uiOnDragEnter);
            scope.$evalAsync(function() {
                uiOnDragEnterFn(scope, {$event: e, $channel: dropChannel});
            });

            $rootScope.$broadcast('ANGULAR_HOVER', dragChannel);
        }

        function onDrop(e) {
            if(e.originalEvent) {
              e.dataTransfer = e.originalEvent.dataTransfer;
            }

            if (e.preventDefault) {
                e.preventDefault(); // Necessary. Allows us to drop.
            }
            if (e.stopPropagation) {
                e.stopPropagation(); // Necessary. Allows us to drop.
            }

            var sendData = e.dataTransfer.getData('text');
            sendData = angular.fromJson(sendData);

            var dropOffset = calculateDropOffset(e);
            
            var position = dropOffset ? {
                x: dropOffset.x - sendData.offset.x,
                y: dropOffset.y - sendData.offset.y
            } : null;
            
            determineEffectAllowed(e);

            var uiOnDropFn = $parse(attr.uiOnDrop);
            scope.$evalAsync(function() {
                uiOnDropFn(scope, {$data: sendData.data, $event: e, $channel: sendData.channel, $position: position});
            });
            element.removeClass(dragEnterClass);
            dragging = 0;
        }
        
        function isDragChannelAccepted(dragChannel, dropChannel) {
            if (dropChannel === '*') {
                return true;
            }

            var channelMatchPattern = new RegExp('(\\s|[,])+(' + dragChannel + ')(\\s|[,])+', 'i');

            return channelMatchPattern.test(',' + dropChannel + ',');
        }

        function preventNativeDnD(e) {
            if(e.originalEvent) {
              e.dataTransfer = e.originalEvent.dataTransfer;
            }

            if (e.preventDefault) {
                e.preventDefault();
            }
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            e.dataTransfer.dropEffect = 'none';
            return false;
        }

        var deregisterDragStart = $rootScope.$on('ANGULAR_DRAG_START', function(_, e, channel, transferDataObject) {
            dragChannel = channel;

            var valid = true;

            if (!isDragChannelAccepted(channel, dropChannel)) {
                valid = false;
            }

            if (valid && attr.dropValidate) {
                var validateFn = $parse(attr.dropValidate);
                valid = validateFn(scope, {
                    $drop: {scope: scope, element: element},
                    $event: e,
                    $data: transferDataObject.data,
                    $channel: transferDataObject.channel
                });
            }

            if (valid) {
                element.bind('dragover', onDragOver);
                element.bind('dragenter', onDragEnter);
                element.bind('dragleave', onDragLeave);
                element.bind('drop', onDrop);

                element.addClass(dragEnterClass);
            } else {
                element.bind('dragover', preventNativeDnD);
                element.bind('dragenter', preventNativeDnD);
                element.bind('dragleave', preventNativeDnD);
                element.bind('drop', preventNativeDnD);

                element.removeClass(dragEnterClass);
            }

        });


        var deregisterDragEnd = $rootScope.$on('ANGULAR_DRAG_END', function() {
            element.unbind('dragover', onDragOver);
            element.unbind('dragenter', onDragEnter);
            element.unbind('dragleave', onDragLeave);

            element.unbind('drop', onDrop);
            element.removeClass(dragHoverClass);
            element.removeClass(dragEnterClass);

            element.unbind('dragover', preventNativeDnD);
            element.unbind('dragenter', preventNativeDnD);
            element.unbind('dragleave', preventNativeDnD);
            element.unbind('drop', preventNativeDnD);
        });

        scope.$on('$destroy', function() {
            deregisterDragStart();
            deregisterDragEnd();
        });


        attr.$observe('dropChannel', function(value) {
            if (value) {
                dropChannel = value;
            }
        });


    };
}

export default uiDroppableDirective;