from sqlite3 import connect, Row
import os
from datetime import datetime

# Ensure the db folder exists
if not os.path.exists('db'):
    os.makedirs('db')

database: str = 'db/Campus.db'


def init_db():
    conn = connect(database)
    cursor = conn.cursor()
    # Create Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            pass TEXT NOT NULL
        )
    """)
    # Create Students Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_account (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            idno TEXT NOT NULL UNIQUE,
            Lastname TEXT NOT NULL,
            Firstname TEXT NOT NULL,
            course TEXT NOT NULL,
            level INTEGER NOT NULL,
            image TEXT
        )
    """)
    # Create Attendance Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_idno TEXT NOT NULL,
            date DATE NOT NULL,
            time_in TEXT,
            time_out TEXT,
            status TEXT NOT NULL DEFAULT 'ABSENT',
            FOREIGN KEY (student_idno) REFERENCES student_account(idno),
            UNIQUE(student_idno, date)
        )
    """)
    conn.commit()
    conn.close()


def getprocessor():
    conn = connect(database)
    conn.row_factory = Row
    return conn


def postprocess():
    conn = connect(database)
    return conn

# --- USER FUNCTIONS ---


def get_all_users():
    """Get all users from database"""
    conn = getprocessor()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user")
    rows = cursor.fetchall()
    conn.close()
    return rows


def get_user_by_id(user_id):
    """Get user by ID"""
    conn = getprocessor()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user


def get_user_by_email(email):
    """Get user by email"""
    conn = getprocessor()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    return user


def add_user(user_data):
    """Add new user"""
    try:
        conn = postprocess()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO user (email, pass) VALUES (?, ?)",
            (user_data['email'], user_data['password'])
        )
        conn.commit()
        conn.close()
        return True, "User added successfully"
    except Exception as e:
        return False, str(e)


def update_user(user_id, user_data):
    """Update user"""
    try:
        conn = postprocess()
        cursor = conn.cursor()

        if 'password' in user_data and user_data['password']:
            cursor.execute(
                "UPDATE user SET email = ?, pass = ? WHERE id = ?",
                (user_data['email'], user_data['password'], user_id)
            )
        else:
            cursor.execute(
                "UPDATE user SET email = ? WHERE id = ?",
                (user_data['email'], user_id)
            )

        conn.commit()
        conn.close()
        return True, "User updated successfully"
    except Exception as e:
        return False, str(e)


def delete_user(user_id):
    """Delete user"""
    try:
        conn = postprocess()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        return True, "User deleted successfully"
    except Exception as e:
        return False, str(e)


def authenticate_user(email, password):
    """Authenticate user"""
    user = get_user_by_email(email)
    if user:
        if user['pass'] == password:
            return True, user
    return False, None

# --- STUDENT FUNCTIONS ---


def get_all():
    """Get all students"""
    conn = getprocessor()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM student_account")
    rows = cursor.fetchall()
    conn.close()
    return rows


def get_student_by_id(student_id):
    """Get student by ID (using idno)"""
    conn = getprocessor()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM student_account WHERE idno = ?", (student_id,))
    student = cursor.fetchone()
    conn.close()
    return student


def add_record(student_data):
    """Add new student"""
    try:
        conn = postprocess()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO student_account (idno, Lastname, Firstname, course, level, image) VALUES (?, ?, ?, ?, ?, ?)",
            (
                student_data['idno'],
                student_data['Lastname'],
                student_data['Firstname'],
                student_data['course'],
                student_data['level'],
                student_data.get('image')
            )
        )
        conn.commit()
        conn.close()
        return True, "Student added successfully"
    except Exception as e:
        return False, str(e)


def update_record(student_idno, student_data):
    """Update student by idno - FIXED: Now includes image update"""
    try:
        conn = postprocess()
        cursor = conn.cursor()

        # FIXED: Include image in update
        cursor.execute(
            "UPDATE student_account SET Lastname = ?, Firstname = ?, course = ?, level = ?, image = ? WHERE idno = ?",
            (
                student_data['Lastname'],
                student_data['Firstname'],
                student_data['course'],
                student_data['level'],
                student_data.get('image'),
                student_idno
            )
        )
        conn.commit()
        conn.close()
        return True, "Student updated successfully"
    except Exception as e:
        return False, str(e)


def delete_record(student_idno):
    """Delete student by idno"""
    try:
        conn = postprocess()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM student_account WHERE idno = ?", (student_idno,))
        conn.commit()
        conn.close()
        return True, "Student deleted successfully"
    except Exception as e:
        return False, str(e)

# --- ATTENDANCE FUNCTIONS ---


def get_attendance_by_date(date):
    """Get all attendance records for a specific date with student info"""
    conn = getprocessor()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            s.idno,
            s.Lastname,
            s.Firstname,
            s.course,
            s.level,
            COALESCE(a.time_in, '') as time_in,
            COALESCE(a.time_out, '') as time_out,
            COALESCE(a.status, 'ABSENT') as status
        FROM student_account s
        LEFT JOIN attendance a ON s.idno = a.student_idno AND a.date = ?
        ORDER BY s.Lastname, s.Firstname
    """, (date,))
    rows = cursor.fetchall()
    conn.close()
    return rows


def mark_attendance(student_idno, date, time_in, status):
    """Mark or update attendance for a student"""
    try:
        conn = postprocess()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id FROM attendance WHERE student_idno = ? AND date = ?",
            (student_idno, date)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                "UPDATE attendance SET time_in = ?, status = ? WHERE student_idno = ? AND date = ?",
                (time_in, status, student_idno, date)
            )
        else:
            cursor.execute(
                "INSERT INTO attendance (student_idno, date, time_in, status) VALUES (?, ?, ?, ?)",
                (student_idno, date, time_in, status)
            )

        conn.commit()
        conn.close()
        return True, "Attendance marked successfully"
    except Exception as e:
        return False, str(e)


def update_attendance_status(student_idno, date, status, time_in=None, time_out=None):
    """Update attendance status and optionally time in/out"""
    try:
        conn = postprocess()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id FROM attendance WHERE student_idno = ? AND date = ?",
            (student_idno, date)
        )
        existing = cursor.fetchone()

        if existing:
            if time_in and time_out:
                cursor.execute(
                    "UPDATE attendance SET status = ?, time_in = ?, time_out = ? WHERE student_idno = ? AND date = ?",
                    (status, time_in, time_out, student_idno, date)
                )
            elif time_in:
                cursor.execute(
                    "UPDATE attendance SET status = ?, time_in = ? WHERE student_idno = ? AND date = ?",
                    (status, time_in, student_idno, date)
                )
            elif time_out:
                cursor.execute(
                    "UPDATE attendance SET status = ?, time_out = ? WHERE student_idno = ? AND date = ?",
                    (status, time_out, student_idno, date)
                )
            else:
                cursor.execute(
                    "UPDATE attendance SET status = ? WHERE student_idno = ? AND date = ?",
                    (status, student_idno, date)
                )
        else:
            cursor.execute(
                "INSERT INTO attendance (student_idno, date, status, time_in) VALUES (?, ?, ?, ?)",
                (student_idno, date, status, time_in)
            )

        conn.commit()
        conn.close()
        return True, "Attendance updated successfully"
    except Exception as e:
        return False, str(e)


def get_attendance_stats(date):
    """Get attendance statistics for a specific date"""
    conn = getprocessor()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM student_account")
    total = cursor.fetchone()['total']

    cursor.execute(
        "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'PRESENT'",
        (date,)
    )
    present = cursor.fetchone()['count']

    cursor.execute(
        "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'LATE'",
        (date,)
    )
    late = cursor.fetchone()['count']

    absent = total - present - late

    conn.close()

    return {
        'total': total,
        'present': present,
        'late': late,
        'absent': absent
    }


# Initialize DB on first run
init_db()
