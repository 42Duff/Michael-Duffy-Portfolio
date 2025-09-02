// script for lego playspace
window.addEventListener('DOMContentLoaded', () => {
    const bricks = document.querySelectorAll('.lego-brick');
    const playzone = document.querySelector('.lego-playzone');
    const menu = document.getElementById('legoMenu');
    const toggleButton = document.getElementById('toggleMenu');

    // menu open/close
    toggleButton.addEventListener("click", () => {
        menu.classList.toggle("hidden");

        toggleButton.textContent = menu.classList.contains("hidden")
        ? "Open Menu"
        : "X";
    });

    const placedRects = [];
    let brickIdCounter = 0;
    let zCounter = 10;

    function bringToFront(el) {
        zCounter++;
        el.style.zIndex = zCounter;
    }

    const snapThreshold = 10;

    // bottom of grabbed snaps to top
    const topSnapTargets = [
        { x: 50, y: 65 },
        { x: 95, y: 65 },
        { x: 140, y: 65 },
        { x: 0, y: 65 },   // full align left edge
        { x: 190, y: 65 }  // full align right edge
    ];


    //top of grabbed snaps to bottom
    const bottomSnapTargets = [
        { x: 50, y: 0 },
        { x: 95, y: 0 },
        { x: 140, y: 0 },
        { x: 0, y: 0 },    // full align left edge
        { x: 190, y: 0 }   // full align right edge
    ];

    function isOverlapping(newRect) {
        return placedRects.some(rect => {
            return !(
                newRect.right < rect.left ||
                newRect.left > rect.right ||
                newRect.bottom < rect.top ||
                newRect.top > rect.bottom
            );
        });
    }

    function generateNonOverlappingPosition(brick) {
        const padding = 10;
        const maxX = playzone.clientWidth - brick.offsetWidth - padding * 2;
        const maxY = playzone.clientHeight - brick.offsetHeight - padding * 2;
        let tries = 0;

        while (tries < 1000) {
            const x = Math.random() * maxX + padding;
            const y = Math.random() * maxY + padding;

            const newRect = {
                left: x,
                top: y,
                right: x + brick.offsetWidth,
                bottom: y + brick.offsetHeight
            };

            if (!isOverlapping(newRect)) {
                placedRects.push(newRect);
                return { x, y };
            }

            tries++;
        }

        return {
            x: (playzone.clientWidth - brick.offsetWidth) / 2,
            y: (playzone.clientHeight - brick.offsetHeight) / 2
        };
    }

    bricks.forEach(brick => {
        brick.style.position = 'absolute';
        const { x, y } = generateNonOverlappingPosition(brick);
        brick.style.transform = `translate(${x}px, ${y}px)`;
        brick.setAttribute('data-x', x);
        brick.setAttribute('data-y', y);
        bringToFront(brick);
    });

    function createBrickFromMenu(original) {
        const type = original.getAttribute('data-type');

        const clone = original.cloneNode(true);
        clone.classList.remove('menu-brick');
        clone.classList.add('lego-brick');
        clone.setAttribute('data-type', type);
        clone.style.position = 'absolute';
        clone.style.zIndex = zCounter++;

        // Set size explicitly
        const sizes = {
            '4': { width: 190},
            '3': { width: 145},
            '2': { width: 100},
            '1': { width: 55}
        };
        const size = sizes[type];
        clone.style.width = `${size.width}px`;
        clone.style.height = `${size.height}px`;

        // Position somewhere visible
        const offsetX = Math.random() * 100 + 100;
        const offsetY = Math.random() * 100 + 100;
        clone.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        clone.setAttribute('data-x', offsetX);
        clone.setAttribute('data-y', offsetY);

        playzone.appendChild(clone);
        placedRects.push({
            left: offsetX,
            top: offsetY,
            right: offsetX + size.width,
            bottom: offsetY + size.height
        });

        bringToFront(clone);

        // Re-bind dragging
        interact(clone).draggable({
            inertia: true,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: '.lego-playzone',
                    endOnly: true
                })
            ],
            listeners: interact('.lego-brick').draggable().listeners
        });
    }

    interact('.lego-brick').draggable({
        inertia: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: '.lego-playzone',
                endOnly: true
            })
        ],
        listeners: {
            start(event) {
                bringToFront(event.target);
            },
            move(event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
            },
            end(event) {
                const dragged = event.target;
                const draggedX = parseFloat(dragged.getAttribute('data-x'));
                const draggedY = parseFloat(dragged.getAttribute('data-y'));

                let bestSnap = null;
                let bestDist = Infinity;

                document.querySelectorAll('.lego-brick').forEach(baseBrick => {
                    if (baseBrick === dragged) return;

                    const baseX = parseFloat(baseBrick.getAttribute('data-x'));
                    const baseY = parseFloat(baseBrick.getAttribute('data-y'));
                    const baseZ = parseInt(baseBrick.style.zIndex || 1);

                    // Dragged goes on top of base
                    [{ x: 0, y: 65 }, { x: 190, y: 65 }].forEach(topCorner => {
                        bottomSnapTargets.forEach(baseSnap => {
                            // Only allow full align if at least one stud is also within threshold
                            const validFullSnap = (baseSnap.x !== 0 && baseSnap.x !== 190) ||
                                (topCorner.x === 0 && baseSnap.x !== 190) ||
                                (topCorner.x === 190 && baseSnap.x !== 0);

                            if (!validFullSnap) return;

                            const testX = draggedX + topCorner.x;
                            const testY = draggedY + topCorner.y;
                            const dist = Math.hypot(testX - (baseX + baseSnap.x), testY - (baseY + baseSnap.y));
                            if (dist < snapThreshold && dist < bestDist) {
                                bestDist = dist;
                                bestSnap = {
                                    x: baseX + baseSnap.x - topCorner.x,
                                    y: baseY + baseSnap.y - topCorner.y,
                                    zIndex: baseZ + 1
                                };
                            }
                        });
                    });

                    // Dragged goes below base
                    [{ x: 0, y: 0 }, { x: 190, y: 0 }].forEach(bottomCorner => {
                        topSnapTargets.forEach(topSnap => {
                            const validFullSnap = (topSnap.x !== 0 && topSnap.x !== 190) ||
                                (bottomCorner.x === 0 && topSnap.x !== 190) ||
                                (bottomCorner.x === 190 && topSnap.x !== 0);

                            if (!validFullSnap) return;

                            const testX = draggedX + bottomCorner.x;
                            const testY = draggedY + bottomCorner.y;
                            const dist = Math.hypot(testX - (baseX + topSnap.x), testY - (baseY + topSnap.y));
                            if (dist < snapThreshold && dist < bestDist) {
                                bestDist = dist;
                                bestSnap = {
                                    x: baseX + topSnap.x - bottomCorner.x,
                                    y: baseY + topSnap.y - bottomCorner.y,
                                    zIndex: baseZ - 1
                                };
                            }
                        });
                    });
                });

                if (bestSnap) {
                    dragged.style.transform = `translate(${bestSnap.x}px, ${bestSnap.y}px)`;
                    dragged.setAttribute('data-x', bestSnap.x);
                    dragged.setAttribute('data-y', bestSnap.y);
                    dragged.style.zIndex = Math.max(1, bestSnap.zIndex);
                }
            }
        }
    });
                interact('.menu-brick').draggable({
                    inertia: true,
                    listeners: {
                        start(event) {
                            createBrickFromMenu(event.target);
                        },
                        move(event) {
                            // No need to do anything — dragging the clone handles this
                        }
                    }
                });
});
