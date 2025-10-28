
/**
 * Validates a password based on defined criteria.
 * @param password - The password string to validate.
 * @returns True if the password meets the criteria, false otherwise.
 */
export function validatePassword(password: string): boolean {
    // At least 8 characters, one uppercase letter, one lowercase letter, one number and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}