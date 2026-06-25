const db = require("../config/db");

const createTask = (req, res) => {

    const user_id = req.user.id;

    const {
        mata_kuliah,
        nama_tugas,
        deskripsi,
        dosen,
        deadline,
        prioritas
    } = req.body;

    const sql = `
        INSERT INTO tasks
        (
            user_id,
            mata_kuliah,
            nama_tugas,
            deskripsi,
            dosen,
            deadline,
            prioritas,
            status
        )
                VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            user_id,
            mata_kuliah,
            nama_tugas,
            deskripsi,
            dosen,
            deadline,
            prioritas,
            "Belum Dikerjakan"
        ],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Database Error"
                });
            }

            res.status(201).json({
                message: "Tugas berhasil ditambahkan"
            });

        }
    );

};
const getTasks = (req, res) => {

    const user_id = req.user.id;

    const sql =
        "SELECT * FROM tasks WHERE user_id = ? ORDER BY deadline ASC";

    db.query(sql, [user_id], (err, result) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Database Error"
            });
        }

        res.status(200).json(result);

    });

};
const updateTask = (req, res) => {

    const user_id = req.user.id;
    const task_id = req.params.id;

    const {
        mata_kuliah,
        nama_tugas,
        deskripsi,
        dosen,
        deadline,
        prioritas,
        status
    } = req.body;

    const sql = `
        UPDATE tasks
        SET
            mata_kuliah = ?,
            nama_tugas = ?,
            deskripsi = ?,
            dosen = ?,
            deadline = ?,
            prioritas = ?,
            status = ?
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        sql,
        [
            mata_kuliah,
            nama_tugas,
            deskripsi,
            dosen,
            deadline,
            prioritas,
            status,
            task_id,
            user_id
        ],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Database Error"
                });
            }

            res.json({
                message: "Task berhasil diupdate"
            });

        }
    );
};
const deleteTask = (req, res) => {

    const task_id = req.params.id;
    const user_id = req.user.id;

    const sql =
        "DELETE FROM tasks WHERE id = ? AND user_id = ?";

    db.query(
        sql,
        [task_id, user_id],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Database Error"
                });
            }

            res.json({
                message: "Task berhasil dihapus"
            });

        }
    );

};
const getStats = (req, res) => {

    const user_id = req.user.id;

    const sql =
        "SELECT * FROM tasks WHERE user_id = ?";

    db.query(sql, [user_id], (err, tasks) => {

        if (err) {
            return res.status(500).json(err);
        }

        const total = tasks.length;

        const selesai =
            tasks.filter(
                t => t.status === "Selesai"
            ).length;

        const belum =
            total - selesai;

        const progress =
            total === 0
                ? 0
                : Math.round(
                    (selesai / total) * 100
                );

        res.json({
            total,
            selesai,
            belum,
            progress
        });

    });

};

const getNearestDeadline = (req, res) => {

    const sql = `
        SELECT *
        FROM tasks
        WHERE user_id = ?
        AND status != 'Selesai'
        ORDER BY deadline ASC
        LIMIT 1
    `;

    db.query(
        sql,
        [req.user.id],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Database Error"
                });

            }

            if (result.length === 0) {
                return res.json(null);
            }

            res.json(result[0]);

        }
    );

};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    getStats,
    getNearestDeadline
};