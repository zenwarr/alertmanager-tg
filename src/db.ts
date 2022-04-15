import { DB } from "https://deno.land/x/sqlite@v3.3.0/mod.ts";


const db = new DB(Deno.env.get("DB_PATH") || "/alertmanager-tg/db.sqlite");
db.query(`
  CREATE TABLE IF NOT EXISTS chats
  (
    id TEXT PRIMARY KEY
  )
`);


export function saveChat(chatId: string) {
  db.query(`
    INSERT
    OR IGNORE INTO chats (id) VALUES (?)
  `, [ chatId ]);
}


export function getChats(): string[] {
  return db.query(`
    SELECT id
      FROM chats
  `).map(r => r[0] as string);
}


export function deleteChat(chatId: string) {
  db.query(`
    DELETE
      FROM chats
      WHERE id = ?
  `, [ chatId ]);
}


export function destroyDb() {
  db.close();
}
