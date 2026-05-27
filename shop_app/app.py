# Main application file
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///shop.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super-secret-key' # ¡Cambia esto por una clave segura y aleatoria en producción!


db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Import models here so that Flask-Migrate can see them
import models

# Import routes after db initialization to avoid circular imports
import routes

if __name__ == '__main__':
    app.run(debug=True)
