import { pool } from '../db.js';
import type { Request, Response } from 'express';
import fs from 'fs';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    let sql = 'SELECT * FROM tasks WHERE user_id = ?;';
    const [rows] = await pool.query(sql, [user_id]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  const { user_id, title, description, due_date } = req.body;

  if (!user_id || !title) {
    return res.status(400).json({ error: 'user_id and title are required' });
  }

  try {
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);
    const user = (userRows as any)[0];
    if (!user) {
      return res.status(400).json({ error: 'User id does not exist' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO tasks (user_id, title, description, is_completed, due_date) VALUES (?, ?, ?, ?, ?)',
      [user_id, title, description || null, false, due_date || null]
    );

    const insertId = (result as any).insertId;
    return res.status(201).json({ task_id: insertId });
  } catch (error: any) {
    console.error(error);
    if (error && (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW')) {
      return res.status(400).json({ error: 'Invalid user_id: user does not exist' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    const task = (rows as any)[0];
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.status(200).json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserTaskById = async (req: Request, res: Response) => {
  const { user_id, id } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, user_id]);
    const task = (rows as any)[0];
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.status(200).json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id, title, description, is_completed, due_date } = req.body;

  const fields: string[] = [];
  const values: any[] = [];

  if (user_id !== undefined) { fields.push('user_id = ?'); values.push(user_id); }
  if (title !== undefined) { fields.push('title = ?'); values.push(title); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (is_completed !== undefined) { fields.push('is_completed = ?'); values.push(is_completed); }
  if (due_date !== undefined) { fields.push('due_date = ?'); values.push(due_date); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'At least one field must be provided to update' });
  }

  try {
    values.push(id);
    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(sql, values);
    const affected = (result as any).affectedRows;
    if (!affected) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    return res.status(200).json((rows as any)[0]);
  } catch (error: any) {
    console.error(error);
    if (error && (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW')) {
      return res.status(400).json({ error: 'Invalid user_id: user does not exist' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateUserTask = async (req: Request, res: Response) => {
  const { user_id, id } = req.params;
  const { title, description, is_completed, due_date } = req.body;

  const fields: string[] = [];
  const values: any[] = [];

  if (title !== undefined) { fields.push('title = ?'); values.push(title); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (is_completed !== undefined) { fields.push('is_completed = ?'); values.push(is_completed); }
  if (due_date !== undefined) { fields.push('due_date = ?'); values.push(due_date); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'At least one field must be provided to update' });
  }

  try {
    values.push(id, user_id);
    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`; 
    const [result] = await pool.query(sql, values);
    const affected = (result as any).affectedRows;
    if (!affected) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, user_id]);
    return res.status(200).json((rows as any)[0]);
  } catch (error: any) {
    if (error && (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW')) {
      return res.status(400).json({ error: 'Invalid user_id: user does not exist' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    const affected = (result as any).affectedRows;
    if (!affected) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteUserTask = async (req: Request, res: Response) => {
  const { user_id, id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, user_id]);
    const affected = (result as any).affectedRows;
    if (!affected) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};