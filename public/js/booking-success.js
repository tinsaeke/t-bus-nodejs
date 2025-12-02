document.addEventListener('DOMContentLoaded', function() {
    const printBtn = document.querySelector('[data-action="print"]');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
});
