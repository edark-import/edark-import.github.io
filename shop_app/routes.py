# Admin and shop routes
from functools import wraps
from flask import Blueprint, render_template, request, redirect, url_for, jsonify, flash, session
from app import app, db # Import app and db from app.py
from models import Product # Import Product model

# --- DECORADOR DE AUTENTICACIÓN ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('admin.login'))
        return f(*args, **kwargs)
    return decorated_function

# --- BLUEPRINT DE ADMINISTRACIÓN ---
admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# --- RUTAS DE AUTENTICACIÓN ---
@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # ¡CAMBIA ESTA CONTRASEÑA EN UN ENTORNO DE PRODUCCIÓN!
        if request.form.get('password') == 'admin123':
            session['admin_logged_in'] = True
            flash('You were successfully logged in.', 'success')
            return redirect(url_for('admin.get_products'))
        else:
            flash('Invalid password.', 'danger')
    return render_template('admin/login.html', title="Admin Login")

@admin_bp.route('/logout')
def logout():
    session.pop('admin_logged_in', None)
    flash('You were successfully logged out.', 'success')
    return redirect(url_for('admin.login'))

# --- RUTAS DE PRODUCTOS (PROTEGIDAS) ---
@admin_bp.route('/products', methods=['GET'])
@login_required
def get_products():
    products = Product.query.all()
    return render_template('admin/products.html', products=products, title="Manage Products")

@admin_bp.route('/products/new', methods=['GET'])
@login_required
def create_product_form():
    return render_template('admin/product_form.html', product=None, title="Add New Product", form_action=url_for('admin.create_product'))

@admin_bp.route('/products', methods=['POST'])
@login_required
def create_product():
    form_data = request.form
    if not form_data.get('name') or not form_data.get('price'):
        flash('Name and Price are required fields.', 'danger')
        return render_template('admin/product_form.html', product=form_data, title="Add New Product", form_action=url_for('admin.create_product')), 400

    try:
        new_product = Product(
            name=form_data['name'],
            description=form_data.get('description', ''),
            price=float(form_data['price']),
            stock=int(form_data.get('stock', 0) or 0),
            image_url=form_data.get('image_url', '')
        )
        db.session.add(new_product)
        db.session.commit()
        flash(f'Product "{new_product.name}" created successfully!', 'success')
        return redirect(url_for('admin.get_products'))
    except ValueError:
        flash('Invalid price or stock format. Please enter valid numbers.', 'danger')
        return render_template('admin/product_form.html', product=form_data, title="Add New Product", form_action=url_for('admin.create_product')), 400
    except Exception as e:
        db.session.rollback()
        flash(f'Error creating product: {str(e)}', 'danger')
        return render_template('admin/product_form.html', product=form_data, title="Add New Product", form_action=url_for('admin.create_product')), 500

@admin_bp.route('/products/<int:product_id>/edit', methods=['GET'])
@login_required
def edit_product_form(product_id):
    product = Product.query.get_or_404(product_id)
    return render_template('admin/product_form.html', product=product, title=f"Edit Product: {product.name}", form_action=url_for('admin.update_product', product_id=product.id))

@admin_bp.route('/products/<int:product_id>/edit', methods=['POST'])
@login_required
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    form_data = request.form

    if not form_data.get('name') or not form_data.get('price'):
        flash('Name and Price are required fields.', 'danger')
        return render_template('admin/product_form.html', product=product, title=f"Edit Product: {product.name}", form_action=url_for('admin.update_product', product_id=product.id), form_data=form_data), 400

    try:
        product.name = form_data.get('name', product.name)
        product.description = form_data.get('description', product.description)
        product.price = float(form_data.get('price', product.price))
        product.stock = int(form_data.get('stock', product.stock) or 0)
        product.image_url = form_data.get('image_url', product.image_url)

        db.session.commit()
        flash(f'Product "{product.name}" updated successfully!', 'success')
        return redirect(url_for('admin.get_products'))
    except ValueError:
        flash('Invalid price or stock format. Please enter valid numbers.', 'danger')
        return render_template('admin/product_form.html', product=product, title=f"Edit Product: {product.name}", form_action=url_for('admin.update_product', product_id=product.id), form_data=form_data), 400
    except Exception as e:
        db.session.rollback()
        flash(f'Error updating product: {str(e)}', 'danger')
        return render_template('admin/product_form.html', product=product, title=f"Edit Product: {product.name}", form_action=url_for('admin.update_product', product_id=product.id), form_data=form_data), 500

@admin_bp.route('/products/<int:product_id>/delete', methods=['POST'])
@login_required
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    try:
        product_name = product.name
        db.session.delete(product)
        db.session.commit()
        flash(f'Product "{product_name}" deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting product "{product.name}": {str(e)}', 'danger')
    return redirect(url_for('admin.get_products'))

@admin_bp.route('/products/<int:product_id>/json', methods=['GET'])
@login_required
def get_product_json(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify({
        'id': product.id, 'name': product.name, 'description': product.description,
        'price': product.price, 'stock': product.stock, 'image_url': product.image_url
    })

@admin_bp.route('/test')
@login_required
def admin_test():
    flash("Admin test route successfully reached!", "info")
    return redirect(url_for('admin.get_products'))

app.register_blueprint(admin_bp)

# --- BLUEPRINT DE LA TIENDA (PÚBLICO) ---
shop_bp = Blueprint('shop', __name__)

@shop_bp.route('/index.html')
def redirect_to_products():
    return redirect(url_for('shop.list_products'))

@shop_bp.route('/', methods=['GET'])
@shop_bp.route('/products', methods=['GET'])
def list_products():
    products = Product.query.filter(Product.stock > 0).order_by(Product.name).all()
    return render_template('shop/product_list.html', products=products, title="Products")

@shop_bp.route('/products/<int:product_id>', methods=['GET'])
def view_product(product_id):
    product = Product.query.get_or_404(product_id)
    return render_template('shop/product_detail.html', product=product, title=product.name)

app.register_blueprint(shop_bp)
