document.addEventListener('DOMContentLoaded', function() {
    const yearSelect = document.getElementById('carYear');
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        for(let year = currentYear; year >= currentYear-30; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.text = year;
            yearSelect.appendChild(option);
        }
        console.log('Yıl seçenekleri eklendi');
    } else {
        console.log('carYear select bulunamadı');
    }
}); 