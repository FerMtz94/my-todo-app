import { neon } from "@neondatabase/serverless";
import type { Request, Response } from "express";

export const getUsers = async (_req: Request, res: Response) => {
	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");
	try {
		const rows = await sql`SELECT * FROM users;`;
		return res.status(200).json(rows);
	} catch (error) {
		return res.status(500).json({ error });
	}
};

export const createUser = async (req: Request, res: Response) => {
	const { username, email, password_hash } = req.body;

	if (!username || !email || !password_hash) {
		return res
			.status(400)
			.json({ error: "username, email and password_hash are required" });
	}

	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");

	try {
		const [result] =
			await sql`INSERT INTO users (username, email, password_hash) VALUES (${username}, ${email}, ${password_hash})`;
		return res.status(201).json({ user_id: result.insertId });
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
	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");

	try {
		const rows =
			await sql`SELECT id, username, email FROM users WHERE id = ${id}`;
		const user = (rows as unknown[])[0];
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		return res.status(200).json(user);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error });
	}
};

export const updateUser = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { username, email, password_hash } = req.body;

	const fields: string[] = [];
	const values: any[] = [];

	if (username) {
		fields.push(`username = ${username}`);
		values.push(username);
	}
	if (email) {
		fields.push(`email = ${email}`);
		values.push(email);
	}
	if (password_hash) {
		fields.push(`password_hash = ${password_hash}`);
		values.push(password_hash);
	}

	if (fields.length === 0) {
		return res.status(400).json({
			error:
				"At least one field (username, email, password_hash) is required to update",
		});
	}

	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");

	try {
		values.push(id);
		const [result] =
			await sql`UPDATE users SET ${fields.join(", ")} WHERE id = ${id}`;
		const affectedRows = (result as unknown & { affectedRows: number })
			.affectedRows;
		if (!affectedRows) {
			return res.status(404).json({ error: "User not found" });
		}

		const [rows] = await sql`SELECT * FROM users WHERE id = ${id}`;
		return res.status(200).json((rows as unknown[])[0]);
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
	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");

	try {
		const [result] = await sql`DELETE FROM users WHERE id = ${id}`;
		const affectedRows = (result as unknown & { affectedRows: number })
			.affectedRows;
		if (!affectedRows) {
			return res.status(404).json({ error: "User not found" });
		}
		return res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};
