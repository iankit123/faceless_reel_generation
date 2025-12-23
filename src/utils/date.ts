/**
 * Returns the current date and time shifted to India Standard Time (IST, UTC+5:30).
 * This is used for storing timestamps in the database in a consistent timezone.
 */
export function getISTDate(): Date {
    const now = new Date();
    // UTC time in milliseconds
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // IST is UTC + 5.5 hours
    const istOffset = 5.5;
    const istDate = new Date(utc + (3600000 * istOffset));
    return istDate;
}
