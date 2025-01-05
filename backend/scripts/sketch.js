function calculateFutureDate(day, month, year, numberOfDays) {
    // Create a new Date object using the provided date
    let date = new Date(year, month - 1, day);
    
    // Add the number of days to the date
    date.setDate(date.getDate() + numberOfDays);
    
    // Extract the new day, month, and year from the updated date
    let newDay = date.getDate();
    let newMonth = date.getMonth() + 1; // Months are zero-based
    let newYear = date.getFullYear();
    
    // Return the new date as an object
    // return { day: newDay, month: newMonth, year: newYear };
    return `${newDay}/${newMonth}/${newYear}`;
}

// Example usage:
let futureDate = calculateFutureDate(12, 11, 2022, 183);
console.log(futureDate); // { day: 14, month: 11, year: 2023 }