function printTicket() {
    const ticketContent = document.getElementById('ticketContent');
    if (ticketContent) {
        const printWindow = window.open('', '_blank');
        
        const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                                 .map(link => link.outerHTML)
                                 .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>T-BUS Ticket</title>
                    ${stylesheets}
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .text-center { text-align: center; }
                        .text-primary { color: #2563eb; }
                        .text-success { color: #10b981; }
                        .fs-4 { font-size: 1.5rem; }
                        .row { display: flex; flex-wrap: wrap; }
                        .col-md-6 { width: 50%; padding: 10px; }
                        .bg-light { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
                        @media print {
                            .modal-footer { display: none; } 
                        }
                    </style>
                </head>
                <body>
                    ${ticketContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    } else {
        window.print();
    }
}

function viewTicketDetails() {
    const modal = new bootstrap.Modal(document.getElementById('ticketModal'));
    modal.show();
}

function refreshStatus() {
    location.reload();
}

async function cancelBooking() {
    const bookingRef = document.querySelector('span.badge.bg-dark')?.textContent.trim();
    const phoneInput = document.querySelector('input[name="passenger_phone"]');
    
    if (!bookingRef || !phoneInput) {
        alert('Unable to find booking information');
        return;
    }

    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch('/cancel-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                booking_reference: bookingRef,
                passenger_phone: phoneInput.value
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Booking cancelled successfully!');
            location.reload();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Cancellation error:', error);
        alert('An error occurred while cancelling the booking');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const mainPrintButton = document.getElementById('mainPrintTicketButton');
    const modalPrintButton = document.getElementById('modalPrintTicketButton');
    const viewDetailsButton = document.getElementById('viewDetailsButton');
    const refreshStatusButton = document.getElementById('refreshStatusButton');
    const cancelBookingButton = document.getElementById('cancelBookingButton');

    if (mainPrintButton) {
        mainPrintButton.addEventListener('click', printTicket);
    }
    if (modalPrintButton) {
        modalPrintButton.addEventListener('click', printTicket);
    }
    if (viewDetailsButton) {
        viewDetailsButton.addEventListener('click', viewTicketDetails);
    }
    if (refreshStatusButton) {
        refreshStatusButton.addEventListener('click', refreshStatus);
    }
    if (cancelBookingButton) {
        cancelBookingButton.addEventListener('click', cancelBooking);
    }
});
