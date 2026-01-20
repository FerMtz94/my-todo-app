import mysql from "mysql2/promise";

const {
  HOST,
  DB_USER,
  PASSWORD,
  DATABASE,
  PGHOST,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
} = process.env;

export const pool = mysql.createPool({
  host: PGHOST ?? HOST,
  user: PGUSER ?? DB_USER,
  password: PGPASSWORD ?? PASSWORD,
  database: PGDATABASE ?? DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
