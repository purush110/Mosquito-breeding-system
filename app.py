from flask import Flask, render_template, request, jsonify
import sqlite3
import os
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_FOLDER = os.path.join(BASE_DIR, "database")
os.makedirs(DATABASE_FOLDER, exist_ok=True)

DATABASE = os.path.join(
    DATABASE_FOLDER,
    "mosquito_reports.db"
)

# Save uploaded photos inside static/uploads
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def create_database():
    connection = get_db_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT NOT NULL,
            description TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            image_path TEXT,
            status TEXT DEFAULT 'Pending',
            created_at TEXT NOT NULL,
            ward TEXT,
            report_type TEXT,
            priority TEXT
        )
    """)

    # Add fields to an existing database if they are missing
    existing_columns = {
        column["name"]
        for column in connection.execute(
            "PRAGMA table_info(reports)"
        ).fetchall()
    }

    new_columns = {
        "ward": "TEXT",
        "report_type": "TEXT",
        "priority": "TEXT"
    }

    for column_name, column_type in new_columns.items():
        if column_name not in existing_columns:
            connection.execute(
                f"ALTER TABLE reports ADD COLUMN {column_name} {column_type}"
            )

    connection.commit()
    connection.close()


create_database()


# Home page
@app.route("/")
def home():
    return render_template("index.html")


# Test backend
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "MosquitoWatch backend is running"
    })


# Get all reports AND submit a new report
@app.route("/api/reports", methods=["GET", "POST"])
def reports_api():

    # GET: Return reports
    if request.method == "GET":
        connection = get_db_connection()

        reports = connection.execute(
            "SELECT * FROM reports ORDER BY id DESC"
        ).fetchall()

        connection.close()

        return jsonify([dict(report) for report in reports])

    # POST: Save a report
    location = request.form.get("location", "").strip()
    description = request.form.get("description", "").strip()

    latitude = request.form.get("latitude") or None
    longitude = request.form.get("longitude") or None

    ward = request.form.get("ward") or None
    report_type = request.form.get("type") or None
    priority = request.form.get("priority") or "Medium"

    if not location or not description:
        return jsonify({
            "status": "error",
            "message": "Location and description are required"
        }), 400

    # Save uploaded photo if one was selected
    image_path = None
    photo = request.files.get("photo")

    if photo and photo.filename:
        if not allowed_file(photo.filename):
            return jsonify({
                "status": "error",
                "message": "Please upload a PNG, JPG, JPEG, or WEBP photo"
            }), 400

        safe_name = secure_filename(photo.filename)
        unique_name = f"{datetime.now().strftime('%Y%m%d%H%M%S%f')}_{safe_name}"

        photo.save(
            os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
        )

        image_path = f"/static/uploads/{unique_name}"

    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    connection = get_db_connection()

    cursor = connection.execute("""
        INSERT INTO reports (
            location,
            description,
            latitude,
            longitude,
            image_path,
            status,
            created_at,
            ward,
            report_type,
            priority
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        location,
        description,
        latitude,
        longitude,
        image_path,
        "Pending",
        created_at,
        ward,
        report_type,
        priority
    ))

    report_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Report submitted successfully",
        "report_id": report_id
    }), 201


# Update report status
@app.route("/api/reports/<int:report_id>/status", methods=["PATCH"])
def update_report_status(report_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    allowed_statuses = ["Pending", "Verified", "Resolved"]

    if new_status not in allowed_statuses:
        return jsonify({
            "status": "error",
            "message": "Invalid status"
        }), 400

    connection = get_db_connection()

    cursor = connection.execute(
        "UPDATE reports SET status = ? WHERE id = ?",
        (new_status, report_id)
    )

    connection.commit()
    connection.close()

    if cursor.rowcount == 0:
        return jsonify({
            "status": "error",
            "message": "Report not found"
        }), 404

    return jsonify({
        "status": "success",
        "message": "Report status updated",
        "report_id": report_id,
        "new_status": new_status
    })


if __name__ == "__main__":
    app.run(debug=True)