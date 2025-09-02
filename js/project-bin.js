//script for project bin click
// background blur
const blur = document.querySelector('.background-blur');

document.querySelectorAll('.project-bin').forEach(projectBin => {
    const binWrapper = projectBin.querySelector('.bin-wrapper'); // inside
    const lid = projectBin.querySelector('.lid');

    projectBin.addEventListener('click', () => {
        //instantly blur background
        blur.classList.add('active');

        // Move bin down
        binWrapper.classList.add('opened');
        projectBin.classList.add('opened'); // marker
        

        // After move finishes, trigger shake
        setTimeout(() => {
            binWrapper.classList.add('shaking');

            // After shake finishes, pop lid
            binWrapper.addEventListener('animationend', function handler() {
                if (binWrapper.classList.contains('shaking')) {
                    binWrapper.classList.remove('shaking'); // reset

                    // 🔹 Animate lid upward
                    lid.classList.add('popping');

                    // 🔹 Wait for pop transition, then hide lid
                    lid.addEventListener('transitionend', function lidGone() {
                        lid.classList.add('hidden'); // disappears

                        // Open modal AFTER bin finishes animation
                        const targetId = projectBin.getAttribute('data-target');
                        document.getElementById(targetId).classList.add('active');

                        lid.removeEventListener('transitionend', lidGone);
                    });
                }

                binWrapper.removeEventListener('animationend', handler);
            });
        }, 600); // matches bin drop transition
    });
});

// Close modal & reset bin + lid
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.project-modal');
        const projectBin = document.querySelector(
            `.project-bin[data-target="${modal.id}"]`
        );
        const binWrapper = projectBin.querySelector('.bin-wrapper');
        const lid = projectBin.querySelector('.lid');

        // close modal and remove blur
        modal.classList.remove('active');
        blur.classList.remove('active');

        // Reset bin state
        binWrapper.classList.remove('opened'); 
        projectBin.classList.remove('opened'); 

        // wait for bin return to finish
        binWrapper.addEventListener('transitionend', function binDone(e) {
            if (e.propertyName === "transform") { // make sure it's the move, not something else
                // Start lid return only after bin has finished
                lid.classList.remove('hidden', 'popping');
                lid.classList.add('returning'); 

                // Clean up "returning" after lid lowers
                lid.addEventListener('transitionend', function resetLid() {
                    lid.classList.remove('returning');
                    lid.removeEventListener('transitionend', resetLid);
                });

                binWrapper.removeEventListener('transitionend', binDone);
            }
        });
    });
});
