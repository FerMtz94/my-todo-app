import { neon } from "@neondatabase/serverless";
import type { Request, Response } from "express";

export const getTasks = async (req: Request, res: Response) => {
	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");
	try {
		const { user_id } = req.params;
		const rows = await sql`SELECT * FROM tasks WHERE user_id = ${user_id}`;
		return res.status(200).json(rows);
	} catch (error) {
		return res.status(500).json({ error });
	}
};

export const createTask = async (req: Request, res: Response) => {
	const { user_id, title, description, due_date } = req.body;

	if (!user_id || !title) {
		return res.status(400).json({ error: "user_id and title are required" });
	}

	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");

	try {
		const [result] = await sql`
			INSERT INTO tasks (user_id, title, description, is_completed, due_date)
			VALUES (${user_id}, ${title}, ${description || null}, false, ${due_date || null})
			RETURNING id
		`;

		return res.status(201).json({ id: result.id });
	} catch (error: any) {
		if (
			error &&
			(error.code === "ER_NO_REFERENCED_ROW_2" ||
				error.code === "ER_NO_REFERENCED_ROW")
		) {
			return res
				.status(400)
				.json({ error: "Invalid user_id: user does not exist" });
		}
		return res.status(500).json({ error });
	}
};

export const getTaskById = async (req: Request, res: Response) => {
	const { id } = req.params;
	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");

	try {
		const [rows] = await sql`SELECT * FROM tasks WHERE id = ${id}`;
		const task = (rows as any)[0];
		if (!task) {
			return res.status(404).json({ error: "Task not found" });
		}
		return res.status(200).json(task);
	} catch (error) {
		return res.status(500).json({ error });
	}
};

export const getUserTaskById = async (req: Request, res: Response) => {
	const { user_id, id } = req.params;
	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");

	try {
		const rows = await sql`
			SELECT * FROM tasks WHERE id = ${id} AND user_id = ${user_id}
		`;
		const task = (rows as any)[0];
		if (!task) {
			return res.status(404).json({ error: "Task not found" });
		}
		return res.status(200).json(task);
	} catch (error) {
		return res.status(500).json({ error });
	}
};

export const updateTask = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { user_id, title, description, is_completed, due_date } = req.body;
	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");

	const fields: string[] = [];

	if (user_id !== undefined) {
		fields.push(`user_id = ${user_id}`);
	}
	if (title !== undefined) {
		fields.push(`title = ${title}`);
	}
	if (description !== undefined) {
		fields.push(`description = ${description || null}`);
	}
	if (is_completed !== undefined) {
		fields.push(`is_completed = ${is_completed}`);
	}
	if (due_date !== undefined) {
		fields.push(`due_date = ${due_date || null}`);
	}

	if (fields.length === 0) {
		return res
			.status(400)
			.json({ error: "At least one field must be provided to update" });
	}

	try {
		const [result] = await sql`
			UPDATE tasks SET ${fields.join(", ")} WHERE id = ${id}
		`;
		const affected = (result as any).affectedRows;
		if (!affected) {
			return res.status(404).json({ error: "Task not found" });
		}

		const [rows] = await sql`SELECT * FROM tasks WHERE id = ${id}`;
		return res.status(200).json((rows as any)[0]);
	} catch (error: any) {
		if (
			error &&
			(error.code === "ER_NO_REFERENCED_ROW_2" ||
				error.code === "ER_NO_REFERENCED_ROW")
		) {
			return res
				.status(400)
				.json({ error: "Invalid user_id: user does not exist" });
		}
		return res.status(500).json({ error });
	}
};

export const updateUserTask = async (req: Request, res: Response) => {
	const { user_id, id } = req.params;
	const { title, description, is_completed, due_date } = req.body;
	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");

	const fields: string[] = [];

	if (title !== undefined) {
		fields.push(`title = ${title}`);
	}
	if (description !== undefined) {
		fields.push(`description = ${description || null}`);
	}
	if (is_completed !== undefined) {
		fields.push(`is_completed = ${is_completed}`);
	}
	if (due_date !== undefined) {
		fields.push(`due_date = ${due_date || null}`);
	}

	if (fields.length === 0) {
		return res
			.status(400)
			.json({ error: "At least one field must be provided to update" });
	}

	try {
		const [result] = await sql`
			UPDATE tasks SET ${fields.join(", ")} WHERE id = ${id} AND user_id = ${user_id}
		`;
		const affected = (result as any).affectedRows;
		if (!affected) {
			return res.status(404).json({ error: "Task not found" });
		}

		const [rows] =
			await sql`SELECT * FROM tasks WHERE id = ${id} AND user_id = ${user_id}`;
		return res.status(200).json((rows as unknown[])[0]);
	} catch (error: any) {
		if (
			error &&
			(error.code === "ER_NO_REFERENCED_ROW_2" ||
				error.code === "ER_NO_REFERENCED_ROW")
		) {
			return res
				.status(400)
				.json({ error: "Invalid user_id: user does not exist" });
		}
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

export const deleteTask = async (req: Request, res: Response) => {
	const { id } = req.params;
	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");

	try {
		const [result] = await sql`
			WITH deleted AS (
				DELETE FROM tasks WHERE id = ${id}
				RETURNING *
			)
			SELECT COUNT(*) AS affectedRows FROM deleted;
		`;
		const affected: number = (result as any).affectedRows;
		if (affected < 1) {
			return res.status(404).json({ error: "Task not found" });
		}
		return res.status(200).json({ message: "Task deleted successfully" });
	} catch (error) {
		return res.status(500).json({ error });
	}
};

export const deleteUserTasks = async (_req: Request, _res: Response) => {
	throw new Error("This method is not implemented yet");
};

export const deleteUserTask = async (req: Request, res: Response) => {
	const { user_id, id } = req.params;
	const sql = neon(process.env.TODO_APP_DB_DATABASE_URL_UNPOOLED || "");

	try {
		const [result] =
			await sql`DELETE FROM tasks WHERE id = ${id} AND user_id = ${user_id}`;
		const affected = (result as any).affectedRows;
		if (!affected) {
			return res.status(404).json({ error: "Task not found" });
		}
		return res.status(200).json({ message: "Task deleted successfully" });
	} catch (error) {
		return res.status(500).json({ error });
	}
};
