// 
require("dotenv").config();

const { Client, QueryResult } = require("pg");

// Automatically logs in with information in .env
const client = new Client();

// Initialize connection
(async () => {
    await client.connect().catch(e => { 
        // Connection unsuccessful
        console.log("Connection unsuccessful.");
        console.error(`${e.name}: ${e.message}`);
        process.exit(0);
    });

    const connectionMessage = `
Connected to database ${client.database}
Host: ${client.host},
Post: ${client.port},
Username: ${client.user}
    `;

    console.log(connectionMessage);
}) ();

/**
 * Sanitize a string
 * @param {string} str the string to sanitize
 * @returns {string} the sanitized string
 */
function sanitizeString(str){
    str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
    return str.trim();
}

/**
 * Create a table
 * @param {string} name the table name
 * @param {string[]} columns the columns
 */
async function createTable (name, columns) {
    const queryText = `
CREATE TABLE ${name} (
    ${columns.join(",\n\t")}
);
    `;
    console.log("Running query: " + queryText);
    await client.query(sanitizeString(queryText));
}

/**
 * Add a row to the table
 * @param {string} name the name of the table
 * @param {any[]} data the row to add
 * @returns {Promise<QueryResult>} the query result
 */
async function addRow (name, data) {
    const queryValues = data.map((_, idx) => "$" + (idx+1));
    const queryText = `INSERT INTO ${name} VALUES (${queryValues.join(", ")});`;
    console.log(queryText);
    return client.query(queryText, data);
}

/**
 * Get the column 
 * @param {string} name 
 */
async function getColumnNames (name) {

}

/**
 * 
 * @param {string} name 
 * @param {any[]} data 
 * @returns {Promise<QueryResult>} the query result
 */
async function addRowNoDuplicates (name, data) {
    // Try to select
    // const hasRow = 
    
    const queryValues = data.map((_, idx) => "$" + (idx+1));
    const queryText = `INSERT INTO ${name} VALUES (${queryValues.join(", ")});`;
    console.log(queryText);
    return client.query(queryText, data);
}

/**
 * Run any query (unsafe)
 * @param {string} query the query
 * @returns {Promise<QueryResult>} the query result
 */
async function runQuery (query, values) {
    if(query.includes("DROP") || query.includes("drop")) {
        console.log("Tried to drop something; xacer make sure nothing bad happens.");
        return;
    }
    //query = sanitizeString(query);
    console.log("Running query", query);
    return client.query(query, values);
}

module.exports = {
    createTable: createTable,
    addRow: addRow,
    addRowNoDuplicates: addRowNoDuplicates,
    runQuery: runQuery,
};

/*

CREATE TABLE members (
  server_id TEXT,
  member_id TEXT,
  number_of_messages INT,
  average_message_length FLOAT,
  average_message_quality FLOAT,
  reputation INT
);

CREATE TABLE censors (
  server_id TEXT,
  word TEXT,
  tier INT
);

CREATE TABLE moderation_actions (
  action_id SERIAL PRIMARY KEY,
  server_id TEXT,
  member_id TEXT,
  action TEXT,
  reason TEXT
);

CREATE TABLE emojis (
  server_id TEXT,
  emoji_id TEXT,
  uses INT,
  rank INT
);

CREATE TABLE voice_profiles (
  server_id TEXT,
  member_id TEXT,
  number_of_samples TEXT,
  voice_profile TEXT
);

*/