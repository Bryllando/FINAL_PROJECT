from sqlite3 import connect, Row
import os
import hashlib

# Ensure the db folder exists
if not os.path.exists('db'):
    os.makedirs('db')

database: str = 'db/Campus.db'


def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def init_db():
    conn = connect(database)
    cursor = conn.cursor()
    # Create Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin'
        )
    """)
    # Create Students Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            studentId TEXT PRIMARY KEY,
            lastName TEXT NOT NULL,
            firstName TEXT NOT NULL,
            course TEXT NOT NULL,
            level INTEGER NOT NULL,
            profile_picture TEXT
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
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    conn.close()
    return rows


def get_user_by_id(user_id):
    """Get user by ID"""
    conn = getprocessor()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user


def get_user_by_email(email):
    """Get user by email"""
    conn = getprocessor()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    return user


def add_user(user_data):
    """Add new user"""
    try:
        conn = postprocess()
        cursor = conn.cursor()
        hashed_password = hash_password(user_data['password'])
        cursor.execute(
            "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
            (user_data['email'], hashed_password,
             user_data.get('role', 'admin'))
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
            hashed_password = hash_password(user_data['password'])
            cursor.execute(
                "UPDATE users SET email = ?, password = ? WHERE id = ?",
                (user_data['email'], hashed_password, user_id)
            )
        else:
            cursor.execute(
                "UPDATE users SET email = ? WHERE id = ?",
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
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        return True, "User deleted successfully"
    except Exception as e:
        return False, str(e)


def authenticate_user(email, password):
    """Authenticate user"""
    user = get_user_by_email(email)
    if user:
        hashed_password = hash_password(password)
        if user['password'] == hashed_password:
            return True, user
    return False, None

# --- STUDENT FUNCTIONS ---


def get_all():
    """Get all students"""
    conn = getprocessor()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students")
    rows = cursor.fetchall()
    conn.close()
    return rows


def get_student_by_id(student_id):
    """Get student by ID"""
    conn = getprocessor()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE studentId = ?", (student_id,))
    student = cursor.fetchone()
    conn.close()
    return student


def add_record(student_data):
    """Add new student"""
    try:
        conn = postprocess()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO students (studentId, lastName, firstName, course, level, profile_picture) VALUES (?, ?, ?, ?, ?, ?)",
            (
                student_data['studentId'],
                student_data['lastName'],
                student_data['firstName'],
                student_data['course'],
                student_data['level'],
                student_data.get('profile_picture')
            )
        )
        conn.commit()
        conn.close()
        return True, "Student added successfully"
    except Exception as e:
        return False, str(e)


def update_record(student_id, student_data):
    """Update student"""
    try:
        conn = postprocess()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE students SET lastName = ?, firstName = ?, course = ?, level = ? WHERE studentId = ?",
            (
                student_data['lastName'],
                student_data['firstName'],
                student_data['course'],
                student_data['level'],
                student_id
            )
        )
        conn.commit()
        conn.close()
        return True, "Student updated successfully"
    except Exception as e:
        return False, str(e)


def delete_record(student_id):
    """Delete student"""
    try:
        conn = postprocess()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM students WHERE studentId = ?", (student_id,))
        conn.commit()
        conn.close()
        return True, "Student deleted successfully"
    except Exception as e:
        return False, str(e)


# Initialize DB on first run
init_db()
