from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from functools import wraps
import db_helper

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


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        success, user = db_helper.authenticate_user(email, password)

        if success:
            session['user_id'] = user['id']
            session['email'] = user['email']
            session['role'] = user['role']
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password', 'error')

    return render_template('auth/login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('auth/register.html')

        user_data = {
            'email': email,
            'password': password,
            'role': 'admin'
        }

        success, message = db_helper.add_user(user_data)

        if success:
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        else:
            flash(f'Registration failed: {message}', 'error')

    return render_template('auth/register.html')


@app.route('/admin')
@login_required
def dashboard():
    user = db_helper.get_all()
    return render_template('admin.html', user_account=user)


@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))


@app.route('/scan')
def scan():
    return render_template('index.html')


# Admin routes
@app.route('/admin')
@login_required
def admin():
    users = db_helper.get_all_users()
    return render_template('admin.html', users=users)


@app.route('/add_user', methods=['POST'])
@login_required
def add_user():
    email = request.form.get('email')
    password = request.form.get('password')

    user_data = {
        'email': email,
        'password': password,
        'role': 'admin'
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
@app.route('/student_mngt')
@login_required
def student_mngt():
    students = db_helper.get_all()
    return render_template('Student_mngt.html', student_account=students, selected_student=None)


@app.route('/add_student', methods=['POST'])
@login_required
def add_student():
    student_data = {
        'studentId': request.form.get('idno'),
        'lastName': request.form.get('lastName'),
        'firstName': request.form.get('firstName'),
        'course': request.form.get('course'),
        'level': request.form.get('level'),
        'profile_picture': None
    }

    success, message = db_helper.add_record(student_data)

    if success:
        flash('Student added successfully!', 'success')
    else:
        flash(f'Failed to add student: {message}', 'error')

    return redirect(url_for('student_mngt'))


@app.route('/save_student', methods=['POST'])
@login_required
def save_student():
    student_id = request.form.get('idno')
    student_data = {
        'lastName': request.form.get('lastname'),
        'firstName': request.form.get('firstname'),
        'course': request.form.get('course'),
        'level': request.form.get('level')
    }

    success, message = db_helper.update_record(student_id, student_data)

    if success:
        flash('Student updated successfully!', 'success')
    else:
        flash(f'Failed to update student: {message}', 'error')

    return redirect(url_for('student_mngt'))


@app.route('/delete_student/<student_id>')
@login_required
def delete_student(student_id):
    success, message = db_helper.delete_record(student_id)

    if success:
        flash('Student deleted successfully!', 'success')
    else:
        flash(f'Failed to delete student: {message}', 'error')

    return redirect(url_for('student_mngt'))


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
