from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from functools import wraps
from datetime import datetime
import db_helper
import re
import os
import base64
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'

# Configure upload folder
UPLOAD_FOLDER = 'static/images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Ensure upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login to access this page', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def check_password_strength(password):
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


def save_base64_image(image_data, student_id):
    try:
        if image_data.startswith('data:image'):
            if ';base64,' in image_data:
                format_part = image_data.split(';')[0].split('/')[-1]
                image_data = image_data.split('base64,')[1]
            else:
                format_part = 'jpeg'

            image_binary = base64.b64decode(image_data)
            ext = 'jpg' if format_part == 'jpeg' else format_part
            filename = secure_filename(
                f"{student_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"
            )
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            with open(filepath, 'wb') as f:
                f.write(image_binary)

            image_path = f"images/{filename}"
            print(
                f"Image saved successfully: {image_path}, size: {len(image_binary)} bytes")
            return image_path

        elif image_data.startswith('/static/'):
            return image_data.replace('/static/', '')

        elif image_data.startswith('images/'):
            return image_data

    except Exception as e:
        print(f"Error saving image: {e}")
        raise

    return None


@app.route('/')
def index():
    # Pass is_logged_in to template
    is_logged_in = 'user_id' in session
    return render_template('index.html', is_logged_in=is_logged_in)


@app.route('/student-management')
@login_required
def student_management():
    students = db_helper.get_all()
    return render_template('dashboard/Student_mngt.html', students=students)


@app.route('/student')
@login_required
def student():
    return render_template('dashboard/Student.html')


@app.route('/attendance')
@login_required
def attendance():
    students = db_helper.get_all()
    return render_template('dashboard/attendance.html', students=students)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('admin'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')

        if not email or not password:
            flash('Please enter both email and password', 'error')
            return render_template('auth/login.html')

        if not validate_email(email):
            flash('Please enter a valid email address', 'error')
            return render_template('auth/login.html')

        success, user = db_helper.authenticate_user(email, password)

        if success:
            session['user_id'] = user['id']
            session['email'] = user['email']
            flash('Login successful! Welcome back.', 'success')
            return redirect(url_for('admin'))
        else:
            flash('Invalid email or password. Please try again.', 'error')

    return render_template('auth/login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if 'user_id' in session:
        return redirect(url_for('admin'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        if not email or not password or not confirm_password:
            flash('All fields are required', 'error')
            return render_template('auth/register.html')

        if not validate_email(email):
            flash('Please enter a valid email address', 'error')
            return render_template('auth/register.html')

        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('auth/register.html')

        strength_check = check_password_strength(password)
        if strength_check['score'] < 3:
            flash(
                f'Password is too weak. Please include: {", ".join(strength_check["feedback"])}', 'error')
            return render_template('auth/register.html')

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


@app.route('/api/check_password_strength', methods=['POST'])
def check_password_strength_api():
    data = request.get_json()
    password = data.get('password', '')

    result = check_password_strength(password)
    return jsonify(result)


@app.route('/api/check-auth')
def check_auth():
    """Check if user is authenticated"""
    return jsonify({'authenticated': 'user_id' in session})


@app.route('/dashboard')
@login_required
def dashboard():
    return redirect(url_for('admin'))


@app.route('/admin')
@login_required
def admin():
    students = db_helper.get_all()
    users = db_helper.get_all_users()
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


@app.route('/add_student', methods=['POST'])
@login_required
def add_student():
    image_path = None
    image_data = request.form.get('image_data')

    if not image_data:
        flash('Profile photo is required', 'error')
        return redirect(url_for('student'))

    try:
        student_id = request.form.get('idno')
        image_path = save_base64_image(image_data, student_id)

        if not image_path:
            flash('Error saving profile photo', 'error')
            return redirect(url_for('student'))

    except Exception as e:
        print(f"Error processing image: {e}")
        flash('Error saving profile photo', 'error')
        return redirect(url_for('student'))

    student_data = {
        'idno': request.form.get('idno'),
        'Lastname': request.form.get('lastName'),
        'Firstname': request.form.get('firstName'),
        'course': request.form.get('course'),
        'level': request.form.get('level'),
        'image': image_path
    }

    success, message = db_helper.add_record(student_data)

    if success:
        flash('Student added successfully!', 'success')
        return redirect(url_for('student_management'))
    else:
        if image_path and image_path.startswith('images/'):
            try:
                os.remove(os.path.join('static', image_path))
            except Exception as e:
                print(f"Error deleting image: {e}")

        flash(f'Failed to add student: {message}', 'error')
        return redirect(url_for('student'))


@app.route('/save_student', methods=['POST'])
@login_required
def save_student():
    student_id = request.form.get('idno')

    existing_student = db_helper.get_student_by_id(student_id)
    image_path = existing_student['image'] if existing_student else None

    image_data = request.form.get('image_data')

    if image_data:
        try:
            if image_data.startswith('data:image'):
                if image_path and image_path.startswith('images/'):
                    old_filepath = os.path.join('static', image_path)
                    if os.path.exists(old_filepath):
                        try:
                            os.remove(old_filepath)
                            print(f"Deleted old image: {old_filepath}")
                        except Exception as e:
                            print(f"Error deleting old image: {e}")

                image_path = save_base64_image(image_data, student_id)

            elif image_data.startswith('/static/'):
                image_path = image_data.replace('/static/', '')

            elif image_data.startswith('images/'):
                image_path = image_data

        except Exception as e:
            print(f"Error processing image: {e}")
            flash('Error saving profile photo', 'error')

    student_data = {
        'Lastname': request.form.get('lastName'),
        'Firstname': request.form.get('firstName'),
        'course': request.form.get('course'),
        'level': request.form.get('level'),
        'image': image_path
    }

    success, message = db_helper.update_record(student_id, student_data)

    if success:
        flash('Student updated successfully!', 'success')
        return redirect(url_for('student_management'))
    else:
        flash(f'Failed to update student: {message}', 'error')
        return redirect(url_for('student'))


# ============================================
# FIXED: Add public endpoint for QR scanner
# Located in app.py - Add this route
# ============================================

@app.route('/api/student_public/<student_id>')
def get_student_public(student_id):
    """
    PUBLIC endpoint for QR scanner to fetch student info
    Does NOT require authentication (no @login_required)
    This allows the scanner on index.html to work
    """
    try:
        # Fetch student from database
        student = db_helper.get_student_by_id(student_id)

        if student:
            # Return success response with student data
            return jsonify({
                'success': True,
                'student': dict(student)  # Convert Row object to dict
            })
        else:
            # Student not found in database
            return jsonify({
                'success': False,
                'message': 'Student not found'
            }), 404

    except Exception as e:
        # Handle any errors
        print(f"Error fetching student: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/delete_student/<student_id>')
@login_required
def delete_student(student_id):
    student = db_helper.get_student_by_id(student_id)
    if student and student['image']:
        image_path = os.path.join('static', student['image'])
        if os.path.exists(image_path):
            try:
                os.remove(image_path)
                print(f"Deleted image: {image_path}")
            except Exception as e:
                print(f"Error deleting image: {e}")

    success, message = db_helper.delete_record(student_id)

    if success:
        flash('Student deleted successfully!', 'success')
    else:
        flash(f'Failed to delete student: {message}', 'error')

    return redirect(url_for('student_management'))


@app.route('/api/student/<student_id>')
def get_student(student_id):
    student = db_helper.get_student_by_id(student_id)
    if student:
        return jsonify({
            'success': True,
            'student': dict(student)
        })
    return jsonify({'success': False, 'message': 'Student not found'}), 404


@app.route('/api/attendance/<date>')
@login_required
def get_attendance(date):
    try:
        attendance_records = db_helper.get_attendance_by_date(date)
        stats = db_helper.get_attendance_stats(date)

        return jsonify({
            'success': True,
            'attendance': [dict(row) for row in attendance_records],
            'stats': stats
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# FIXED: Update attendance marking endpoint
# Make it work for both authenticated and public access
# ============================================

@app.route('/api/attendance/mark', methods=['POST'])
def mark_attendance_public():
    """
    PUBLIC endpoint to mark attendance from QR scanner
    Removed @login_required to allow scanner to work
    """
    try:
        # Get data from request
        data = request.get_json()
        student_idno = data.get('student_idno')
        date = data.get('date')
        time_in = data.get('time_in')
        status = data.get('status', 'PRESENT')

        # Validate required fields
        if not student_idno or not date or not time_in:
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400

        # Mark attendance in database
        success, message = db_helper.mark_attendance(
            student_idno, date, time_in, status
        )

        if success:
            return jsonify({
                'success': True,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400

    except Exception as e:
        print(f"Error marking attendance: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/attendance/update_status', methods=['POST'])
@login_required
def update_attendance_status():
    try:
        data = request.get_json()
        student_idno = data.get('student_idno')
        date = data.get('date')
        status = data.get('status')
        time_out = data.get('time_out')

        success, message = db_helper.update_attendance_status(
            student_idno, date, status, time_out)

        if success:
            return jsonify({'success': True, 'message': message})
        else:
            return jsonify({'success': False, 'message': message}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
