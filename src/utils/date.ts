/**
 * Returns the current date and time.
 * Note: For Supabase timestamptz columns, we just need a standard Date object.
 * The database and UI handle regional offsets (like IST) automatically.
 */
export function getISTDate(): Date {
    return new Date();
}
