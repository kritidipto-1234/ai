import sqlite3 from 'sqlite3';
import { promisify } from 'util';

interface Todo {
  id: number;
  task: string;
  due_date: string;
  created_at: string;
}

class TodoDatabase {
  private db: sqlite3.Database;
  private dbGet: (sql: string, ...params: any[]) => Promise<any>;
  private dbAll: (sql: string, ...params: any[]) => Promise<any[]>;

  constructor() {
    this.db = new sqlite3.Database('todos.db');
    this.dbGet = promisify(this.db.get.bind(this.db));
    this.dbAll = promisify(this.db.all.bind(this.db));
    this.initDatabase();
  }

  // Custom run method that properly captures lastID and changes
  private dbRun(sql: string, ...params: any[]): Promise<{ lastID?: number; changes?: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  private async initDatabase() {
    await this.dbRun(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task TEXT NOT NULL,
        due_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getAllTodos(): Promise<Todo[]> {
    return await this.dbAll('SELECT * FROM todos ORDER BY created_at DESC');
  }

  async createTodo(task: string, dueDate?: string): Promise<{ id: number; success: boolean }> {
    try {
      const result = await this.dbRun(
        'INSERT INTO todos (task, due_date) VALUES (?, ?)',
        task,
        dueDate || null
      );
      return { id: result.lastID!, success: true };
    } catch (error) {
      console.error('Database error:', error);
      return { id: -1, success: false };
    }
  }

  async deleteTodoById(id: number): Promise<{ success: boolean; deleted: boolean }> {
    try {
      const result = await this.dbRun('DELETE FROM todos WHERE id = ?', id);
      return { success: true, deleted: result.changes! > 0 };
    } catch (error) {
      console.error('Database error:', error);
      return { success: false, deleted: false };
    }
  }

  async searchTodo(query: string): Promise<Todo[]> {
    return await this.dbAll('SELECT * FROM todos WHERE task LIKE ? ORDER BY created_at DESC', `%${query}%`);
  }

  close() {
    this.db.close();
  }
}

export { TodoDatabase, Todo };