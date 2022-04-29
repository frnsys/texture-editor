import config
from .routes import bp
from flask import Flask

app = Flask(__name__)
app.config.from_object(config)
app.register_blueprint(bp)
