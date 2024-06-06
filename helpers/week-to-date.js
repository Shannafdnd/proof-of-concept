export default function getDateOfIsoWeek(week, year) {
    week = parseFloat(week);
    year = parseFloat(year);
  
    if (week < 1 || week > 53) {
      throw new RangeError("ISO 8601 weeks are numbered from 1 to 53");
    } else if (!Number.isInteger(week)) {
      throw new TypeError("Week must be an integer");
    } else if (!Number.isInteger(year)) {
      throw new TypeError("Year must be an integer");
    }
  
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const isoWeekStart = simple;

    // Get the Monday past, and add a week if the day was
    // Friday, Saturday or Sunday.
  
    isoWeekStart.setDate(simple.getDate() - dayOfWeek + 1);
    if (dayOfWeek > 4) {
        isoWeekStart.setDate(isoWeekStart.getDate() + 7);
    }

    // The latest possible ISO week starts on December 28 of the current year.
    if (isoWeekStart.getFullYear() > year ||
        (isoWeekStart.getFullYear() == year &&
         isoWeekStart.getMonth() == 11 &&
         isoWeekStart.getDate() > 28)) {
        throw new RangeError(`${year} has no ISO week ${week}`);
    }
  
    return isoWeekStart;
}
