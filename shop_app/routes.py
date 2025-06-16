# Admin and shop routes
from flask import Blueprint, render_template, request, redirect, url_for, jsonify, flash
from app import app, db # Import app and db from app.py
from models import Product # Import Product model

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# Route to display list of products (renders products.html)
@admin_bp.route('/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return render_template('admin/products.html', products=products, title="Manage Products")

# Route to display form for adding a new product
@admin_bp.route('/products/new', methods=['GET'])
def create_product_form():
    return render_template('admin/product_form.html', product=None, title="Add New Product", form_action=url_for('admin.create_product'))

# Route to handle submission for creating a new product
@admin_bp.route('/products', methods=['POST'])
def create_product():
    form_data = request.form # Using request.form for HTML forms
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

# Route to display form for editing an existing product
@admin_bp.route('/products/<int:product_id>/edit', methods=['GET'])
def edit_product_form(product_id):
    product = Product.query.get_or_404(product_id)
    return render_template('admin/product_form.html', product=product, title=f"Edit Product: {product.name}", form_action=url_for('admin.update_product', product_id=product.id))

# Route to handle submission for updating an existing product
@admin_bp.route('/products/<int:product_id>/edit', methods=['POST'])
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

# Delete Product (using POST for form submission from products.html)
@admin_bp.route('/products/<int:product_id>/delete', methods=['POST'])
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

# Optional: Keep a JSON endpoint for single product details if an API is desired
@admin_bp.route('/products/<int:product_id>/json', methods=['GET'])
def get_product_json(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify({
        'id': product.id, 'name': product.name, 'description': product.description,
        'price': product.price, 'stock': product.stock, 'image_url': product.image_url
    })

@admin_bp.route('/test')
def admin_test():
    # This route is less useful now that we have a full product listing page
    # but can be kept for other testing.
    flash("Admin test route successfully reached!", "info")
    return redirect(url_for('admin.get_products'))

app.register_blueprint(admin_bp)

# Shop Blueprint
shop_bp = Blueprint('shop', __name__)

# Redirect /index.html to /products
@shop_bp.route('/index.html')
def redirect_to_products():
    return redirect(url_for('shop.list_products'))

# List Products (GET / or /products)
@shop_bp.route('/', methods=['GET'])
@shop_bp.route('/products', methods=['GET'])
def list_products():
    products = Product.query.filter(Product.stock > 0).order_by(Product.name).all() # Only show products in stock, ordered by name
    return render_template('shop/product_list.html', products=products, title="Products")

# View Single Product (GET /products/<int:product_id>)
@shop_bp.route('/products/<int:product_id>', methods=['GET'])
def view_product(product_id):
    product = Product.query.get_or_404(product_id)
    return render_template('shop/product_detail.html', product=product, title=product.name)

# Register the shop blueprint
app.register_blueprint(shop_bp)
