import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";

export async function getTopFocus(userId:number){const [rows]=await getDb().query<(RowDataPacket&{tracker_id:number})[]>("SELECT tracker_id FROM user_top_focus WHERE user_id=? LIMIT 1",[userId]);return rows[0]?Number(rows[0].tracker_id):null}
export async function setTopFocus(userId:number,trackerId:number|null){const db=getDb();if(trackerId===null){await db.execute("DELETE FROM user_top_focus WHERE user_id=?",[userId]);return null}const [owned]=await db.query<RowDataPacket[]>("SELECT id FROM trackers WHERE id=? AND user_id=? AND is_archived=FALSE LIMIT 1",[trackerId,userId]);if(!owned.length)throw new Error("TRACKER_NOT_FOUND");await db.execute("INSERT INTO user_top_focus (user_id,tracker_id) VALUES (?,?) ON DUPLICATE KEY UPDATE tracker_id=VALUES(tracker_id)",[userId,trackerId]);return trackerId}
