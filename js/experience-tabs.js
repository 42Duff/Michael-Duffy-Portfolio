// script for experience tabs
const tabs = document.querySelectorAll('.tab-button');
const panels = document.querySelectorAll('.experience-panel');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Reset tab button states 
        tabs.forEach(t => t.classList.remove('bg-[#FCC10B]', 'text-black', 'shadow'));
        tabs.forEach(t => t.classList.add('text-neutral-300'));

        // Activate clicked tab
        tab.classList.add('bg-[#FCC10B]', 'text-black', 'shadow');
        tab.classList.remove('text-neutral-300');

        // Show correct panel
        panels.forEach(panel => panel.classList.add('hidden'));
        document.getElementById(tab.dataset.target + 'Panel').classList.remove('hidden');
    });
});
    