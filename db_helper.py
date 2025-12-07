from sqlite3 import connect, Row
import os

# Ensure the db folder exists
if not os.path.exists('db'):
    os.makedirs('db')

database: str = 'db/Campus.db'


def init_db():
    conn = connect(database)
    cursor = conn.cursor()
    # Create Users Table (matching your schema: id, email, pass)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            pass TEXT NOT NULL
        )
    """)
    # Create Students Table (matching your schema: id, idno, Lastname, Firstname, course, level, image)
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


def get_student_by_db_id(db_id):
    """Get student by database ID"""
    conn = getprocessor()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM student_account WHERE id = ?", (db_id,))
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
    """Update student by idno"""
    try:
        conn = postprocess()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE student_account SET Lastname = ?, Firstname = ?, course = ?, level = ? WHERE idno = ?",
            (
                student_data['Lastname'],
                student_data['Firstname'],
                student_data['course'],
                student_data['level'],
                student_idno
            )
        )
        conn.commit()
        conn.close()
        return True, "Student updated successfully"
    except Exception as e:
        return False, str(e)


def update_record_by_id(db_id, student_data):
    """Update student by database ID"""
    try:
        conn = postprocess()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE student_account SET idno = ?, Lastname = ?, Firstname = ?, course = ?, level = ? WHERE id = ?",
            (
                student_data['idno'],
                student_data['Lastname'],
                student_data['Firstname'],
                student_data['course'],
                student_data['level'],
                db_id
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


def delete_record_by_id(db_id):
    """Delete student by database ID"""
    try:
        conn = postprocess()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM student_account WHERE id = ?", (db_id,))
        conn.commit()
        conn.close()
        return True, "Student deleted successfully"
    except Exception as e:
        return False, str(e)


# Initialize DB on first run
init_db()
