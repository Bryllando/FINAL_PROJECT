from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from functools import wraps
import db_helper
import re

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'

# Login required decorator


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login to access this page', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def check_password_strength(password):
    """Check password strength and return score and feedback"""
    score = 0
    feedback = []

    if len(password) >= 8:
        score += 1
    else:
        feedback.append("At least 8 characters")

    if re.search(r'[A-Z]', password):
        score += 1
    else:
        feedback.append("One uppercase letter")

    if re.search(r'[a-z]', password):
        score += 1
    else:
        feedback.append("One lowercase letter")

    if re.search(r'\d', password):
        score += 1
    else:
        feedback.append("One number")

    if re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
        score += 1
    else:
        feedback.append("One special character")

    # Determine strength level
    if score <= 2:
        strength = "weak"
    elif score <= 3:
        strength = "medium"
    elif score <= 4:
        strength = "strong"
    else:
        strength = "very strong"

    return {
        'score': score,
        'strength': strength,
        'feedback': feedback
    }


@app.route('/')
def index():
    # If user is already logged in, redirect to admin (main landing)
    if 'user_id' in session:
        return redirect(url_for('admin'))
    return render_template('index.html')


# Student Management Route - Shows the table of students
@app.route('/student-management')
@login_required
def student_management():
    students = db_helper.get_all()
    return render_template('dashboard/Student_mngt.html', students=students)


# NEW: Student Form Route - For adding/editing students
@app.route('/student')
@login_required
def student():
    return render_template('dashboard/Student.html')


# Attendance Route - Just for attendance tracking
@app.route('/attendance')
@login_required
def attendance():
    students = db_helper.get_all()
    return render_template('dashboard/attendance.html', students=students)


@app.route('/login', methods=['GET', 'POST'])
def login():
    # If user is already logged in, redirect to admin
    if 'user_id' in session:
        return redirect(url_for('admin'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')

        # Validate inputs
        if not email or not password:
            flash('Please enter both email and password', 'error')
            return render_template('auth/login.html')

        # Validate email format
        if not validate_email(email):
            flash('Please enter a valid email address', 'error')
            return render_template('auth/login.html')

        success, user = db_helper.authenticate_user(email, password)

        if success:
            session['user_id'] = user['id']
            session['email'] = user['email']
            flash('Login successful! Welcome back.', 'success')
            # Redirect to the admin page which renders dashboard/admin.html
            return redirect(url_for('admin'))
        else:
            flash('Invalid email or password. Please try again.', 'error')

    return render_template('auth/login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    # If user is already logged in, redirect to admin
    if 'user_id' in session:
        return redirect(url_for('admin'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        # Validate inputs
        if not email or not password or not confirm_password:
            flash('All fields are required', 'error')
            return render_template('auth/register.html')

        # Validate email format
        if not validate_email(email):
            flash('Please enter a valid email address', 'error')
            return render_template('auth/register.html')

        # Check if passwords match
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('auth/register.html')

        # Check password strength
        strength_check = check_password_strength(password)
        if strength_check['score'] < 3:
            flash(
                f'Password is too weak. Please include: {", ".join(strength_check["feedback"])}', 'error')
            return render_template('auth/register.html')

        # Check if email already exists
        existing_user = db_helper.get_user_by_email(email)
        if existing_user:
            flash('Email already exists. Please use a different email or login.', 'error')
            return render_template('auth/register.html')

        user_data = {
            'email': email,
            'password': password
        }

        success, message = db_helper.add_user(user_data)

        if success:
            flash(
                'Account created successfully! Please login with your credentials.', 'success')
            return redirect(url_for('login'))
        else:
            flash(f'Registration failed: {message}', 'error')

    return render_template('auth/register.html')


# API endpoint for email validation
@app.route('/api/check_email', methods=['POST'])
def check_email():
    data = request.get_json()
    email = data.get('email', '').strip()

    if not email:
        return jsonify({'available': False, 'message': 'Email is required'})

    if not validate_email(email):
        return jsonify({'available': False, 'message': 'Invalid email format'})

    existing_user = db_helper.get_user_by_email(email)
    if existing_user:
        return jsonify({'available': False, 'message': 'Email already exists'})

    return jsonify({'available': True, 'message': 'Email is available'})


# API endpoint for password strength check
@app.route('/api/check_password_strength', methods=['POST'])
def check_password_strength_api():
    data = request.get_json()
    password = data.get('password', '')

    result = check_password_strength(password)
    return jsonify(result)


# Dashboard route (kept for compatibility) -> redirect to admin
@app.route('/dashboard')
@login_required
def dashboard():
    # Redirect to admin as admin is the main landing page/template
    return redirect(url_for('admin'))


# Admin route that renders the admin template file
@app.route('/admin')
@login_required
def admin():
    # Get all students and users for the admin view
    students = db_helper.get_all()
    users = db_helper.get_all_users()
    # Admin UI is located at templates/dashboard/admin.html
    return render_template('dashboard/admin.html',
                           student_account=students,
                           users=users,
                           students=students)


@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully', 'info')
    return redirect(url_for('login'))


@app.route('/scan')
def scan():
    return render_template('index.html')


# User management routes
@app.route('/add_user', methods=['POST'])
@login_required
def add_user():
    email = request.form.get('email')
    password = request.form.get('password')

    user_data = {
        'email': email,
        'password': password
    }

    success, message = db_helper.add_user(user_data)

    if success:
        flash('User added successfully!', 'success')
    else:
        flash(f'Failed to add user: {message}', 'error')

    return redirect(url_for('admin'))


@app.route('/update_user', methods=['POST'])
@login_required
def update_user():
    user_id = request.form.get('id')
    email = request.form.get('email')
    password = request.form.get('password')

    user_data = {
        'email': email,
        'password': password
    }

    success, message = db_helper.update_user(user_id, user_data)

    if success:
        flash('User updated successfully!', 'success')
    else:
        flash(f'Failed to update user: {message}', 'error')

    return redirect(url_for('admin'))


@app.route('/delete_user/<int:id>')
@login_required
def delete_user_route(id):
    success, message = db_helper.delete_user(id)

    if success:
        flash('User deleted successfully!', 'success')
    else:
        flash(f'Failed to delete user: {message}', 'error')

    return redirect(url_for('admin'))


# Student management routes
@app.route('/add_student', methods=['POST'])
@login_required
def add_student():
    student_data = {
        'idno': request.form.get('idno'),
        'Lastname': request.form.get('lastName'),
        'Firstname': request.form.get('firstName'),
        'course': request.form.get('course'),
        'level': request.form.get('level'),
        'image': None
    }

    success, message = db_helper.add_record(student_data)

    if success:
        flash('Student added successfully!', 'success')
        # Redirect back to student management page
        return redirect(url_for('student_management'))
    else:
        flash(f'Failed to add student: {message}', 'error')
        return redirect(url_for('student'))


@app.route('/save_student', methods=['POST'])
@login_required
def save_student():
    student_id = request.form.get('idno')
    student_data = {
        'Lastname': request.form.get('lastname'),
        'Firstname': request.form.get('firstname'),
        'course': request.form.get('course'),
        'level': request.form.get('level')
    }

    success, message = db_helper.update_record(student_id, student_data)

    if success:
        flash('Student updated successfully!', 'success')
        return redirect(url_for('student_management'))
    else:
        flash(f'Failed to update student: {message}', 'error')
        return redirect(url_for('student'))


@app.route('/delete_student/<student_id>')
@login_required
def delete_student(student_id):
    success, message = db_helper.delete_record(student_id)

    if success:
        flash('Student deleted successfully!', 'success')
    else:
        flash(f'Failed to delete student: {message}', 'error')

    return redirect(url_for('student_management'))


# API routes
@app.route('/api/student/<student_id>')
def get_student(student_id):
    student = db_helper.get_student_by_id(student_id)
    if student:
        return jsonify({
            'success': True,
            'student': dict(student)
        })
    return jsonify({'success': False, 'message': 'Student not found'}), 404


if __name__ == '__main__':
    app.run(debug=True)
