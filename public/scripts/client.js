const calendar = document.getElementById("calendar")

function scrollCalendar(direction) {
    const scrollAmount = direction * calendar.clientWidth;
    calendar.scrollBy(scrollAmount, 0);
}