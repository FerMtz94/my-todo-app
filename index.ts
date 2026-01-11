import express from 'express';
import { pool } from './db.js';
import { getUsers, createUser, getUserById, updateUser, deleteUser } from './controllers/users.js';

const app = express();
const port = 3000;

app.use(express.json());

pool.getConnection()
    .then(connection => {
        console.log("Connected to MySQL database successfully!");
        connection.release(); // Release the connection immediately after testing
    })
    .catch(err => {
        console.error("Database connection failed:", err.message);
    });

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/users', async (req, res) => await getUsers(req, res));
app.post('/users', async (req, res) => await createUser(req, res));
app.get('/users/:id', async (req, res) => await getUserById(req, res));
app.put('/users/:id', async (req, res) => await updateUser(req, res));
app.delete('/users/:id', async (req, res) => await deleteUser(req, res));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});