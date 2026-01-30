/**
 * Database Configuration with SQL Injection Protection
 * Uses parameterized queries and prepared statements
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for better performance and security
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Security settings
    multipleStatements: false, // Prevent SQL injection via multiple statements
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    // SSL configuration (uncomment if using SSL)
    // ssl: {
    //     ca: fs.readFileSync(__dirname + '/mysql-ca-cert.pem')
    // }
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('✓ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('✗ Database connection failed:', err.message);
        process.exit(1);
    });

/**
 * Execute a query with automatic SQL injection protection
 * Always use prepared statements
 * @param {string} sql - SQL query with placeholders (?)
 * @param {Array} params - Parameters to bind to the query
 * @returns {Promise} Query result
 */
async function query(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}

/**
 * Execute a transaction safely
 * @param {Function} callback - Transaction operations
 * @returns {Promise}
 */
async function transaction(callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Sanitize input to prevent SQL injection
 * Note: This is a backup - always use parameterized queries
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
        .replace(/['"\\;]/g, '') // Remove quotes, backslashes, semicolons
        .replace(/--/g, '') // Remove SQL comments
        .replace(/\/\*/g, '') // Remove block comment start
        .replace(/\*\//g, '') // Remove block comment end
        .trim();
}

/**
 * Validate and sanitize table/column names
 * Only allow alphanumeric and underscores
 * @param {string} name - Table or column name
 * @returns {string} Validated name
 */
function validateIdentifier(name) {
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        throw new Error('Invalid identifier: only alphanumeric and underscores allowed');
    }
    return name;
}

module.exports = {
    pool,
    query,
    transaction,
    sanitizeInput,
    validateIdentifier
};
