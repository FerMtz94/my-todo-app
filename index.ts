import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { getUsers, createUser, getUserById, updateUser, deleteUser } from './controllers/users.js';
import { getTasks, createTask, getTaskById, getUserTaskById, updateTask,
         updateUserTask, deleteTask, deleteUserTask } from './controllers/tasks.js';

const app = express();
const port = 3000;
const allowedOriginsRegexp = /https:\/\/my-todo-client-mu.vercel\.app.*/;
const corsOptions = {
  origin: allowedOriginsRegexp,
  optionsSuccessStatus: 200
}

app.use(express.json());
app.use(cors(corsOptions));

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

app.get('/users/:user_id/tasks', async (req, res) => await getTasks(req, res));
app.post('/users/:user_id/tasks', async (req, res) => await createTask(req, res));

app.get('/tasks/:id', async (req, res) => await getTaskById(req, res));
app.get('/users/:user_id/tasks/:id', async (req, res) => await getUserTaskById(req, res));

app.put('/tasks/:id', async (req, res) => await updateTask(req, res));
app.put('/users/:user_id/tasks/:id', async (req, res) => await updateUserTask(req, res));

app.delete('/tasks/:id', async (req, res) => await deleteTask(req, res));
app.delete('/users/:user_id/tasks/:id', async (req, res) => await deleteUserTask(req, res));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});