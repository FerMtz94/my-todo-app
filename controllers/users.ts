import type { Request, Response } from "express";
import { pool } from "../db.js";

export const getUsers = async (_req: Request, res: Response) => {
	try {
		const [rows, _fields] = await pool.query("SELECT * FROM users;");
		return res.status(200).json(rows);
	} catch (_error) {
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

export const createUser = async (req: Request, res: Response) => {
	const { username, email, password_hash } = req.body;

	if (!username || !email || !password_hash) {
		return res
			.status(400)
			.json({ error: "username, email and password_hash are required" });
	}

	try {
		const [result] = await pool.query(
			"INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
			[username, email, password_hash],
		);
		const insertId = (result as any).insertId;
		const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [
			insertId,
		]);
		return res.status(201).json((rows as any)[0]);
	} catch (error: any) {
		if (error && error.code === "ER_DUP_ENTRY") {
			return res
				.status(409)
				.json({ error: "Username or email already exists" });
		}
		console.error(error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getUserById = async (req: Request, res: Response) => {
	const { id } = req.params;

	try {
		const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
		const user = (rows as any)[0];
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		return res.status(200).json(user);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

export const updateUser = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { username, email, password_hash } = req.body;

	const fields: string[] = [];
	const values: any[] = [];

	if (username) {
		fields.push("username = ?");
		values.push(username);
	}
	if (email) {
		fields.push("email = ?");
		values.push(email);
	}
	if (password_hash) {
		fields.push("password_hash = ?");
		values.push(password_hash);
	}

	if (fields.length === 0) {
		return res
			.status(400)
			.json({
				error:
					"At least one field (username, email, password_hash) is required to update",
			});
	}

	try {
		values.push(id);
		const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
		const [result] = await pool.query(sql, values);
		const affectedRows = (result as any).affectedRows;
		if (!affectedRows) {
			return res.status(404).json({ error: "User not found" });
		}

		const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
		return res.status(200).json((rows as any)[0]);
	} catch (error: any) {
		if (error && error.code === "ER_DUP_ENTRY") {
			return res
				.status(409)
				.json({ error: "Username or email already exists" });
		}
		console.error(error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

export const deleteUser = async (req: Request, res: Response) => {
	const { id } = req.params;

	try {
		const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
		const affectedRows = (result as any).affectedRows;
		if (!affectedRows) {
			return res.status(404).json({ error: "User not found" });
		}
		return res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};
